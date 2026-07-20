# 5. One layered skeleton for all backends

Status: **Accepted**

## Context

The four backends were built at different times with divergent internal layouts.
That made moving between them costly: business logic was entangled with FastAPI
handlers, tests sat in different places, and there was no consistent seam to inject
fakes.

## Decision

Refactor every backend to one lightweight **layered skeleton**:

```
app/
  main.py           # app factory + lifespan (dependency assembly)
  core/             # settings, security, errors, logging, middleware
  api/routes/*.py   # HTTP only: route -> service; api/deps.py for shared deps
  schemas/          # pydantic DTOs
  services/         # business logic, framework-free and testable
  <domain>/ · db/   # adapters and data access
```

The MCP server (FastMCP, not FastAPI) mirrors the spirit: `server.py` factory,
`core/`, `tools/`, `resources/`. Because the refactor touched already-verified
code, each service was re-run through its runtime verification afterward to prove
behaviour was unchanged.

## Consequences

- Uniform mental model: the same file does the same job in every repo.
- Services are unit-testable without FastAPI; routes stay thin.
- The app factory is the injection seam — tests pass fakes (a compiled graph, a
  fake store) without touching process env.
- Refactoring verified code carried risk, mitigated by re-verification per service.
