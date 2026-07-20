# 3. LangGraph checkpointer for agent state

Status: **Accepted**

## Context

The research agent was fully stateless: every `/research` call started fresh with
no session history, no resumability, and nothing to audit after the fact. We
wanted per-session history, the ability to resume a thread, and an auditable
record of each superstep — without hand-rolling a state store.

LangGraph provides a checkpointer abstraction with a Postgres backend
(`AsyncPostgresSaver`) for production and an in-memory `MemorySaver` for
offline/demo. Streaming must use `astream(stream_mode=["updates","custom"])`
(not `astream_events`, which is incompatible with a checkpointer).

## Decision

Compile the graph with a **checkpointer keyed by `thread_id`**:

- **Durable**: when `ORCH_DATABASE_URL` is set, the lifespan swaps in an
  `AsyncPostgresSaver` writing to the `orchestrator` schema. `GET
  /v1/research/history/{thread_id}` reads committed supersteps back.
- **Default**: without a database URL, an in-process `MemorySaver` keeps history
  working offline. Startup logs a warning that this is demo-only and grows
  unbounded — long-running deployments must configure Postgres.

SSE uses `astream(stream_mode=["updates","custom"])` so streaming and
checkpointing coexist.

## Consequences

- Sessions are resumable and inspectable per `thread_id`, across restarts when
  durable.
- The default `MemorySaver` is an explicit demo-only tradeoff, surfaced at
  startup rather than hidden.
- History access is not per-caller scoped by design (single-operator console);
  the trust boundary is documented on the history/runs routes.
