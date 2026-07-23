import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoadmapHandler } from './roadmap.ts';

const MD = '# Roadmap\n\n## Now\n\n- [~] **Doing this.** right now\n';

function appWith(url: string, ttlMs?: number): Hono {
  const app = new Hono();
  app.get('/api/roadmap', createRoadmapHandler(url, ttlMs));
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/roadmap', () => {
  it('serves the upstream markdown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(MD, { status: 200 }))),
    );
    const res = await appWith('https://example.test/ROADMAP.md').request('/api/roadmap');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    expect(await res.text()).toBe(MD);
  });

  it('caches within the TTL — one upstream fetch for many requests', async () => {
    const upstream = vi.fn(() => Promise.resolve(new Response(MD, { status: 200 })));
    vi.stubGlobal('fetch', upstream);
    const app = appWith('https://example.test/ROADMAP.md', 60_000);
    await app.request('/api/roadmap');
    await app.request('/api/roadmap');
    await app.request('/api/roadmap');
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('serves the stale copy when the upstream starts failing', async () => {
    const upstream = vi
      .fn()
      .mockResolvedValueOnce(new Response(MD, { status: 200 }))
      .mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', upstream);
    const app = appWith('https://example.test/ROADMAP.md', 0); // every request re-fetches
    await app.request('/api/roadmap');
    const res = await app.request('/api/roadmap');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(MD);
  });

  it('503s when there is no cache and the upstream is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    const res = await appWith('https://example.test/ROADMAP.md').request('/api/roadmap');
    expect(res.status).toBe(503);
  });

  it('404s when the source is disabled (empty url)', async () => {
    const res = await appWith('').request('/api/roadmap');
    expect(res.status).toBe(404);
  });

  it('does not cache a non-OK upstream response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('nope', { status: 500 }))),
    );
    const res = await appWith('https://example.test/ROADMAP.md').request('/api/roadmap');
    expect(res.status).toBe(503);
  });
});
