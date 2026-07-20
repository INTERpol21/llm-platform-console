# 1. Polyrepo + a shared OpenAPI contracts package

Status: **Accepted**

## Context

The platform is four independently deployable services (llm-gateway,
rag-pgvector, mcp-tools-server, agent-orchestrator) plus this console. Each
backend lives in its own repository and ships on its own cadence. The OpenAI
chat schema was duplicated across three services and the RAG schema across two,
so schema drift was a standing risk: a backend could change a response shape and
nothing would catch a stale consumer until runtime.

A monorepo would remove drift by construction but would force a large, risky
migration and couple release cadences we deliberately keep separate.

## Decision

Keep the **polyrepo** topology, and add a single **contracts package**
(`packages/contracts` in the console) that holds real OpenAPI snapshots of the
three HTTP backends. The console (`web` and `bff`) consumes generated artifacts
from those snapshots — never hand-written API types.

Snapshots are refreshed by dumping `create_app().openapi()` from each backend and
committing the JSON; CI checks the committed generated output is in sync.

## Consequences

- No schema drift between the console and the backends: types and validators come
  from the same source of truth.
- Refreshing a contract is an explicit, reviewable step (dump → regenerate →
  commit), not an implicit coupling.
- The MCP server (stdio/HTTP, not called by the console) is out of scope; its
  TypedDicts stay hand-maintained.
- Cross-backend Python model sharing (deduping the OpenAI schema) remains future
  work — the contracts package solves the *frontend* drift first.
