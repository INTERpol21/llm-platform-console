# Architecture Decision Records

These ADRs capture the significant, hard-to-reverse decisions behind the LLM
platform (the four backends + this console). They are the consolidated,
platform-wide record; each backend repo links here rather than duplicating them.

Format is lightweight [MADR](https://adr.github.io/madr/): **Context → Decision →
Consequences**, plus a status. An ADR is immutable once **Accepted** — to change a
decision, add a new ADR that supersedes it.

| # | Decision | Status |
|---|---|---|
| [0001](0001-polyrepo-plus-contracts.md) | Polyrepo + a shared OpenAPI contracts package | Accepted |
| [0002](0002-single-postgres-schemas.md) | One Postgres instance, isolated per-service schemas | Accepted |
| [0003](0003-langgraph-postgres-checkpointer.md) | LangGraph checkpointer for agent state | Accepted |
| [0004](0004-feature-sliced-design.md) | Strict Feature-Sliced Design on the frontend | Accepted |
| [0005](0005-backend-layered-skeleton.md) | One layered skeleton for all backends | Accepted |
| [0006](0006-kubb-contract-codegen.md) | Kubb codegen (types + Zod) from OpenAPI | Accepted |
| [0007](0007-unified-v1-prefix.md) | Unified `/v1` API prefix across services | Accepted |
| [0008](0008-bff-single-origin.md) | Single-origin BFF holds keys; backends have no CORS | Accepted |
| [0009](0009-untrusted-context-fencing.md) | Fence + defang untrusted context against prompt injection | Accepted |
| [0010](0010-css-modules-not-tailwind.md) | CSS Modules + Radix primitives, not Tailwind | Accepted |
