# 2. One Postgres instance, isolated per-service schemas

Status: **Accepted**

## Context

Three concerns need durable storage: RAG documents/chunks (pgvector), the
agent's LangGraph checkpoints, and per-call/per-run telemetry. Running a separate
Postgres instance per concern multiplies operational overhead (backups,
connections, upgrades) for a portfolio-scale platform, while a single shared
database with no isolation would let one service's migrations or table names
collide with another's.

## Decision

Run **one Postgres instance** for the platform, partitioned into **isolated
schemas**:

- `rag` — documents/chunks with the pgvector index and local-first source tags.
- `orchestrator` — the LangGraph checkpointer tables.
- `telemetry` — `model_runs` and `research_runs`.

Each service owns and migrates only its own schema; the search_path is set per
connection. The pgvector image tag is pinned to `pg16` with pgvector ≥ 0.8
(needed for iterative scans under metadata filters).

## Consequences

- One instance to run, back up and upgrade; durable volumes survive `compose down`.
- Schema isolation keeps migrations and table namespaces independent — a service
  cannot accidentally read or clobber another's tables.
- The checkpointer reuses the RAG database rather than standing up a second store.
- A retention/backup policy for the growing `telemetry` and checkpoint tables is
  tracked as follow-up work (durable rows grow without bound otherwise).
