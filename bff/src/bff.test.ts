/**
 * BFF proxy behaviour, fully offline. Upstream is a stubbed globalThis.fetch;
 * the app is driven through Hono's `app.request(...)` helper. Each test's
 * comment states the concrete regression it guards against.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.ts';
import type { Config } from './config.ts';

interface Captured {
  url: string;
  method: string;
  headers: Headers;
  body: unknown;
  signal: AbortSignal | null;
}

let captured: Captured[] = [];
let responder: (req: Captured) => Response | Promise<Response>;
const realFetch = globalThis.fetch;

function stubFetch(): void {
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const req: Captured = {
      url: typeof input === 'string' ? input : input.toString(),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: init?.body ?? null,
      signal: init?.signal ?? null,
    };
    captured.push(req);
    return responder(req);
  });
  globalThis.fetch = fn as unknown as typeof fetch;
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    gateway: { url: 'http://gw.test', key: 'gw-secret' },
    rag: { url: 'http://rag.test', key: 'rag-secret' },
    orch: { url: 'http://orch.test', key: 'orch-secret' },
    port: 8787,
    rateLimitPerMinute: 240,
    maxBodyBytes: 12 * 1024 * 1024,
    roadmapUrl: '', // proxy tests: live-roadmap source off
    ...overrides,
  };
}

function okJson(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  captured = [];
  responder = () => okJson();
  stubFetch();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('prefix stripping + Authorization injection', () => {
  // Catches: mount prefix left on the upstream path, or wrong/missing platform key.
  const cases = [
    {
      path: '/api/gateway/v1/models/catalog',
      upstream: 'http://gw.test/v1/models/catalog',
      key: 'gw-secret',
    },
    { path: '/api/rag/query', upstream: 'http://rag.test/query', key: 'rag-secret' },
    {
      path: '/api/orchestrator/research/history/t1',
      upstream: 'http://orch.test/research/history/t1',
      key: 'orch-secret',
    },
  ] as const;

  for (const { path, upstream, key } of cases) {
    it(`${path} -> ${upstream} with Bearer ${key}`, async () => {
      const app = createApp(makeConfig());
      const res = await app.request(path);
      expect(res.status).toBe(200);
      expect(captured).toHaveLength(1);
      expect(captured[0]?.url).toBe(upstream);
      expect(captured[0]?.headers.get('authorization')).toBe(`Bearer ${key}`);
    });
  }

  it('preserves the query string when stripping the prefix', async () => {
    // Catches: query string dropped or duplicated during rewrite.
    const app = createApp(makeConfig());
    await app.request('/api/gateway/v1/usage?window=24h&user=me');
    expect(captured[0]?.url).toBe('http://gw.test/v1/usage?window=24h&user=me');
  });

  it('replaces any browser-supplied Authorization with the platform key', async () => {
    // Catches: a browser bearer token leaking through to the backend.
    const app = createApp(makeConfig());
    await app.request('/api/rag/stats', {
      headers: { authorization: 'Bearer browser-token' },
    });
    expect(captured[0]?.headers.get('authorization')).toBe('Bearer rag-secret');
  });

  it('forwards method and body for non-GET requests', async () => {
    // Catches: POST body or method being dropped by the proxy.
    const app = createApp(makeConfig());
    await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'hello' }),
    });
    expect(captured[0]?.method).toBe('POST');
    expect(captured[0]?.url).toBe('http://rag.test/ingest');
  });
});

describe('SSE pass-through', () => {
  it('streams the body live with X-Accel-Buffering:no and no buffering', async () => {
    // Catches: SSE responses being buffered, or the anti-buffering header missing,
    // which would stall a live research trace behind an intermediary.
    responder = () => {
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode('event: token\ndata: alpha\n\n'));
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    };

    const app = createApp(makeConfig());
    const res = await app.request('/api/orchestrator/research/stream', {
      method: 'POST',
      body: JSON.stringify({ query: 'q' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-accel-buffering')).toBe('no');
    // The response body is a live stream we pass through, not a buffered string.
    expect(res.body).toBeInstanceOf(ReadableStream);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const text = await res.text();
    expect(text).toContain('event: token');
    expect(text).toContain('data: [DONE]');
  });
});

describe('correlation id', () => {
  it('echoes an incoming X-Request-ID and forwards it upstream', async () => {
    // Catches: correlation id not propagated to backend or not echoed to client.
    const app = createApp(makeConfig());
    const res = await app.request('/api/gateway/healthz', {
      headers: { 'x-request-id': 'corr-abc-123' },
    });
    expect(res.headers.get('x-request-id')).toBe('corr-abc-123');
    expect(captured[0]?.headers.get('x-request-id')).toBe('corr-abc-123');
  });

  it('generates one when absent and uses the same id both ways', async () => {
    // Catches: missing generation, or client/upstream ids diverging.
    const app = createApp(makeConfig());
    const res = await app.request('/api/gateway/healthz');
    const echoed = res.headers.get('x-request-id');
    expect(echoed).toBeTruthy();
    expect(captured[0]?.headers.get('x-request-id')).toBe(echoed);
  });
});

describe('client-disconnect propagation', () => {
  it('binds an abort signal to the upstream fetch', async () => {
    // Catches: a client disconnect (nav away / stopped SSE) leaving the upstream
    // fetch running, so the orchestrator streams into a dead pipe and connections
    // pile up. The proxy must pass the request's signal through to fetch.
    const app = createApp(makeConfig());
    await app.request('/api/orchestrator/research/stream', { method: 'POST', body: '{}' });
    expect(captured[0]?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('rate limiting', () => {
  it('returns 429 with Retry-After once the per-client budget is exceeded', async () => {
    // Catches: limiter not applied to /api/*, or never rejecting a flood.
    const app = createApp(makeConfig({ rateLimitPerMinute: 3 }));
    const headers = { 'x-forwarded-for': '9.9.9.9' };

    for (let i = 0; i < 3; i++) {
      const ok = await app.request('/api/gateway/healthz', { headers });
      expect(ok.status).toBe(200);
    }

    const limited = await app.request('/api/gateway/healthz', { headers });
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    // The rejected request must never reach the backend.
    expect(captured).toHaveLength(3);
  });

  it('buckets clients independently by X-Forwarded-For', async () => {
    // Catches: a global bucket throttling unrelated clients.
    const app = createApp(makeConfig({ rateLimitPerMinute: 1 }));

    const a1 = await app.request('/api/gateway/healthz', {
      headers: { 'x-forwarded-for': '1.1.1.1' },
    });
    const b1 = await app.request('/api/gateway/healthz', {
      headers: { 'x-forwarded-for': '2.2.2.2' },
    });
    expect(a1.status).toBe(200);
    expect(b1.status).toBe(200);

    const a2 = await app.request('/api/gateway/healthz', {
      headers: { 'x-forwarded-for': '1.1.1.1' },
    });
    expect(a2.status).toBe(429);
  });
});

describe('BFF-local health', () => {
  it('serves /api/health without touching any upstream', async () => {
    // Catches: health accidentally proxied, or consuming rate-limit budget.
    const app = createApp(makeConfig());
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
    expect(captured).toHaveLength(0);
  });
});

describe('body cap', () => {
  it('413s an oversized declared body without touching the upstream', async () => {
    stubFetch();
    responder = () => new Response('{}', { status: 200 });
    const app = createApp(makeConfig({ maxBodyBytes: 1024 }));
    const res = await app.request('/api/rag/v1/ingest', {
      method: 'POST',
      headers: { 'content-length': String(10 * 1024 * 1024), 'content-type': 'application/json' },
      body: 'x',
    });
    expect(res.status).toBe(413);
    expect(captured).toEqual([]); // the upstream fetch never happened
  });

  it('passes a normal-sized body through', async () => {
    stubFetch();
    responder = () => new Response('{}', { status: 200 });
    const app = createApp(makeConfig({ maxBodyBytes: 1024 * 1024 }));
    const res = await app.request('/api/rag/v1/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ documents: [] }),
    });
    expect(res.status).toBe(200);
  });
});
