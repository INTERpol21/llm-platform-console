# 6. Kubb codegen (types + Zod) from OpenAPI

Status: **Accepted**

## Context

Given the contracts package (ADR 0001), the console needs TypeScript types and
runtime validators derived from the OpenAPI snapshots. Hand-writing them
reintroduces exactly the drift the snapshots exist to prevent, and hand-written
Zod schemas can silently disagree with the types.

## Decision

Generate from OpenAPI with **Kubb**: `@kubb/plugin-ts` emits TypeScript types and
`@kubb/plugin-zod` emits matching Zod schemas, one output tree per service under
`packages/contracts/src/<service>/`. The console imports
`@console/contracts/<service>` and never edits `generated/`. Regeneration is
`pnpm contracts`; CI checks the output is in sync with the snapshots.

SSE routes are hand-wired (fetch-event-source), not driven by generated query
hooks, because streaming needs custom lifecycle control.

## Consequences

- Types and validators come from one generator pass, so they cannot disagree.
- A backend response-shape change surfaces as a typecheck error after
  regeneration, at build time rather than runtime.
- Generated symbol names are path-derived, so changing a route path (e.g. the /v1
  move, ADR 0007) renames symbols and requires updating import sites — an
  acceptable, mechanical cost.
- `barrelType: named` keeps imports explicit.
