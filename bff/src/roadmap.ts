/**
 * Live roadmap passthrough: serves the raw ROADMAP.md fetched from the repo's
 * main branch, so the Mission-control panel tracks merged reality without an
 * image rebuild. Single-origin stays intact — the browser never talks to
 * GitHub, the BFF does.
 *
 * A tiny in-process cache (60 s) keeps the panel's refetch interval from
 * turning into one upstream request per browser tab. Failures return 503 and
 * the SPA falls back to the copy baked in at build time.
 */

import type { Handler } from 'hono';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  markdown: string;
  fetchedAt: number;
}

export function createRoadmapHandler(url: string, ttlMs: number = CACHE_TTL_MS): Handler {
  let cache: CacheEntry | null = null;

  return async (c) => {
    if (!url) return c.text('roadmap source disabled', 404);

    if (cache && Date.now() - cache.fetchedAt < ttlMs) {
      return c.text(cache.markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' });
    }
    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
      const markdown = await upstream.text();
      cache = { markdown, fetchedAt: Date.now() };
      return c.text(markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' });
    } catch {
      // A stale copy beats an error while the upstream blips.
      if (cache) {
        return c.text(cache.markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' });
      }
      return c.text('roadmap source unavailable', 503);
    }
  };
}
