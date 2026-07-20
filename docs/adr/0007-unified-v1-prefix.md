# 7. Unified `/v1` API prefix across services

Status: **Accepted**

## Context

The gateway served its API under `/v1`, but rag exposed `/ingest`, `/query`,
`/stats` and the orchestrator exposed `/research…` at the root. The mismatch
meant the contracts package had three differently-shaped path spaces, and the BFF
and console had to special-case each backend's prefix.

## Decision

Serve **every backend API under a unified `/v1` prefix**. rag and the
orchestrator now mount their routers at `/v1`; liveness (`/healthz`) stays
unversioned. The legacy unprefixed paths keep working during the transition —
they are **dual-registered** but hidden from the OpenAPI schema (`include_in_schema
= False`) — so existing clients don't break while the schema advertises only
`/v1`.

Dual-registration was chosen over 307 redirects because it preserves method and
body natively (important for streaming POSTs) with no redirect-following
assumptions.

## Consequences

- One consistent path shape across services; the console's per-service base URLs
  all carry `/v1`.
- Old integrations keep working through the transition; the schema nudges them to
  migrate.
- Regenerating contracts renamed path-derived symbols; console import sites were
  updated once (see ADR 0006).
- The legacy routes should be removed in a later release once no client depends on
  them.
