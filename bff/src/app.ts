/**
 * Hono application wiring: BFF-local health, per-client rate limiting, and the
 * three reverse-proxy groups. Exported as a factory so tests can inject a
 * config and drive it via `app.request(...)` without a live socket.
 */

import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { type Config, config as defaultConfig } from './config.ts';
import { createProxy } from './proxy.ts';
import { RateLimiter } from './rate-limit.ts';
import { createRoadmapHandler } from './roadmap.ts';

/** Best-effort client identity for rate-limit bucketing. */
function clientKey(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    // No node socket in the test/edge context; a shared key is fine here.
    return 'unknown';
  }
}

export function createApp(config: Config = defaultConfig): Hono {
  const app = new Hono();
  const limiter = new RateLimiter(config.rateLimitPerMinute);

  // BFF-local liveness — registered before the limiter so health checks are
  // free and never proxy to a backend.
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  // Live delivery roadmap for the Mission-control panel. Also pre-limiter:
  // it is served from a 60 s in-process cache, and a wall of dashboard tabs
  // polling it every minute must not eat the per-IP budget real API calls use.
  app.get('/api/roadmap', createRoadmapHandler(config.roadmapUrl));

  // Body cap before anything buffers or proxies: checks Content-Length up
  // front and counts streamed bytes, so it also covers chunked uploads the
  // backends' header-based caps cannot see.
  app.use(
    '/api/*',
    bodyLimit({
      maxSize: config.maxBodyBytes,
      onError: (c) => c.json({ error: 'payload_too_large' }, 413),
    }),
  );

  // Token-bucket rate limit across all proxied /api/* traffic.
  app.use('/api/*', async (c, next) => {
    const { allowed, retryAfterSeconds } = limiter.check(clientKey(c));
    if (!allowed) {
      return c.json({ error: 'rate_limited' }, 429, {
        'retry-after': String(retryAfterSeconds),
      });
    }
    await next();
  });

  app.all(
    '/api/gateway/*',
    createProxy({ prefix: '/api/gateway', base: config.gateway.url, key: config.gateway.key }),
  );
  app.all(
    '/api/rag/*',
    createProxy({ prefix: '/api/rag', base: config.rag.url, key: config.rag.key }),
  );
  app.all(
    '/api/orchestrator/*',
    createProxy({ prefix: '/api/orchestrator', base: config.orch.url, key: config.orch.key }),
  );

  return app;
}
