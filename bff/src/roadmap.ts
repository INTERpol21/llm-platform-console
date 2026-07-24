/**
 * Live roadmap passthrough: serves the raw ROADMAP.md fetched from the repo's
 * main branch, so the Mission-control panel tracks merged reality without an
 * image rebuild. Single-origin stays intact — the browser never talks to
 * GitHub, the BFF does.
 *
 * Hardening (2026-07-24 audit): a single in-flight fetch is shared by all
 * concurrent cold-cache requests (no stampede), and the fetched body is
 * size-capped — ROADMAP_URL is operator-configurable, so a misconfigured
 * upstream must not buffer an arbitrarily large file into memory.
 *
 * A tiny in-process cache (60 s) keeps the panel's refetch interval from
 * turning into one upstream request per browser tab. Failures return 503 and
 * the SPA falls back to the copy baked in at build time.
 */

import type { Handler } from 'hono';

const CACHE_TTL_MS = 60_000;
/** A roadmap is a text file; anything bigger than this is a misconfiguration. */
const MAX_ROADMAP_BYTES = 1024 * 1024;

interface CacheEntry {
  markdown: string;
  fetchedAt: number;
}

export function createRoadmapHandler(url: string, ttlMs: number = CACHE_TTL_MS): Handler {
  let cache: CacheEntry | null = null;
  let inFlight: Promise<string> | null = null;

  async function fetchUpstream(): Promise<string> {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const declared = Number(upstream.headers.get('content-length') ?? '0');
    if (declared > MAX_ROADMAP_BYTES) throw new Error(`upstream body ${declared} bytes`);
    const markdown = await upstream.text();
    if (markdown.length > MAX_ROADMAP_BYTES) throw new Error('upstream body over the cap');
    cache = { markdown, fetchedAt: Date.now() };
    return markdown;
  }

  return async (c) => {
    if (!url) return c.text('roadmap source disabled', 404);

    if (cache && Date.now() - cache.fetchedAt < ttlMs) {
      return c.text(cache.markdown, 200, { 'content-type': 'text/markdown; charset=utf-8' });
    }
    try {
      // Cold cache: every concurrent request awaits the SAME upstream fetch.
      inFlight ??= fetchUpstream().finally(() => {
        inFlight = null;
      });
      const markdown = await inFlight;
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
