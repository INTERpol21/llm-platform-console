# 8. Single-origin BFF holds keys; backends have no CORS

Status: **Accepted**

## Context

The browser must reach three backends, but those backends have no CORS and hold
bearer keys that must never ship to the client. Exposing keys to the SPA, or
opening CORS on the backends, would both be security regressions.

## Decision

Route the browser through a **single origin**: Caddy serves the SPA static build
and proxies `/api/*` to a **Hono BFF**. The BFF injects `Authorization: Bearer`
per backend, adds a correlation id, enforces its own perimeter rate limit, and
proxies to gateway/rag/orchestrator — **passing SSE through untouched** so the
agent trace streams live. Platform keys live only in the BFF/backend env, never
in the browser.

The BFF binds the client's abort signal to the upstream fetch, so a browser
disconnect tears down the upstream stream instead of leaking it. Its rate-limiter
map evicts idle buckets so it cannot grow without bound.

## Consequences

- No CORS on backends and no browser-visible keys: one hardened entry point.
- The perimeter rate limit (per client) complements the gateway's per-key limit —
  they are layered, not redundant.
- SSE requires care across the proxy chain (flush, no buffering, heartbeat,
  `X-Accel-Buffering: no`); this is handled in the BFF and Caddy config.
- The BFF is a single process-local instance; a multi-instance deployment would
  need a shared limiter store.
