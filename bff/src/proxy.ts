/**
 * Reverse-proxy handler factory.
 *
 * One handler per backend group. It strips the `/api/<svc>` mount prefix,
 * injects the platform Bearer key (replacing any browser-supplied
 * Authorization), forwards method/query/headers/body, propagates a request
 * id, and returns the upstream status + body. SSE bodies are streamed through
 * untouched with buffering disabled so traces arrive live.
 */

import type { Context } from 'hono';

export interface ProxyOptions {
  /** Mount prefix to strip, e.g. "/api/gateway". */
  readonly prefix: string;
  /** Upstream origin, e.g. "http://localhost:8080". */
  readonly base: string;
  /** Platform Bearer key for this backend (never leaks to the browser). */
  readonly key: string;
}

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Hop-by-hop headers (RFC 7230 6.1) plus framing headers that must not be
 * copied verbatim across the proxy boundary in either direction.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function isSse(contentType: string | null): boolean {
  return contentType?.toLowerCase().includes('text/event-stream') ?? false;
}

/** Build the request headers sent upstream. */
function buildRequestHeaders(c: Context, opts: ProxyOptions, requestId: string): Headers {
  const out = new Headers();
  c.req.raw.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Drop any browser-supplied Authorization; we inject the platform key below.
    if (lower === 'authorization') return;
    if (lower === REQUEST_ID_HEADER) return;
    out.set(name, value);
  });
  out.set('authorization', `Bearer ${opts.key}`);
  out.set(REQUEST_ID_HEADER, requestId);
  return out;
}

/** Build the response headers returned to the browser. */
function buildResponseHeaders(upstream: Response, requestId: string): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // fetch already decoded the body; a stale content-encoding would corrupt it.
    if (lower === 'content-encoding') return;
    out.set(name, value);
  });
  out.set(REQUEST_ID_HEADER, requestId);

  if (isSse(upstream.headers.get('content-type'))) {
    // Defeat reverse-proxy buffering (nginx et al.) so events flush live.
    out.set('x-accel-buffering', 'no');
    out.set('cache-control', 'no-cache');
  }
  return out;
}

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);

export function createProxy(opts: ProxyOptions) {
  return async (c: Context): Promise<Response> => {
    const incoming = new URL(c.req.url);

    // Strip the mount prefix so /api/gateway/v1/models -> /v1/models upstream.
    let path = incoming.pathname.slice(opts.prefix.length);
    if (path === '') path = '/';
    const target = `${opts.base}${path}${incoming.search}`;

    const requestId = c.req.header(REQUEST_ID_HEADER) ?? crypto.randomUUID();
    const headers = buildRequestHeaders(c, opts, requestId);

    const method = c.req.method;
    const hasBody = !METHODS_WITHOUT_BODY.has(method);

    // Bind the client's abort signal so a browser disconnect (navigation, or a
    // stopped SSE stream) tears down the upstream fetch too — otherwise the
    // orchestrator keeps streaming into a dead pipe and connections accumulate.
    const init: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
      signal: c.req.raw.signal,
    };
    if (hasBody) {
      init.body = c.req.raw.body;
      // Required by the fetch spec when streaming a request body.
      init.duplex = 'half';
    }

    let upstream: Response;
    try {
      upstream = await fetch(target, init);
    } catch (err) {
      // Never surface backend URLs/keys; just report the gateway failure.
      const message = err instanceof Error ? err.message : 'upstream fetch failed';
      return c.json({ error: 'bad_gateway', detail: message }, 502, {
        [REQUEST_ID_HEADER]: requestId,
      });
    }

    const responseHeaders = buildResponseHeaders(upstream, requestId);

    // Stream the body straight through (SSE or otherwise) — no buffering.
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  };
}
