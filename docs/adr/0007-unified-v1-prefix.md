# 7. Unified `/v1` API prefix across services

Status: **Accepted**

## Context

The gateway served its API under `/v1`, but rag exposed `/ingest`, `/query`,
`/stats` and the orchestrator exposed `/research…` at the root. The mismatch
meant the contracts package had three differently-shaped path spaces, and the BFF
and console had to special-case each backend's prefix.

## Decision

Serve **every backend API under a unified `/v1` prefix**. rag and the
orchestrator mount their routers at `/v1`; liveness (`/healthz`) stays
unversioned.

The unification briefly shipped with the old unprefixed paths dual-registered (so
in-flight clients wouldn't break), but since the only consumer — this console —
moved to `/v1` immediately and the backends are not publicly deployed, the legacy
paths were removed for a clean single surface. They now return 404, asserted by a
test in each service.

## Consequences

- One consistent path shape across services; the console's per-service base URLs
  all carry `/v1`. Only `/healthz` is unversioned.
- Regenerating contracts renamed path-derived symbols; console import sites were
  updated once (see ADR 0006).
- No transitional cruft: the old paths are gone, not hidden. A future public
  client must use `/v1`.
