# 4. Strict Feature-Sliced Design on the frontend

Status: **Accepted**

## Context

The console has several distinct surfaces (research, models, usage, knowledge,
telemetry, mission-control) that share primitives but must not tangle into each
other. Without an enforced structure, a React app of this size drifts into
cross-imports and circular dependencies that make features impossible to reason
about in isolation.

## Decision

Adopt **strict Feature-Sliced Design**: layers `app → pages → widgets → features
→ entities → shared`, imports only flow downward, and slices in the same layer do
not import each other. Each slice exposes a public API through its `index.ts`.

Enforcement is **Steiger** (a standalone FSD linter) in CI — not
`eslint-plugin-boundaries`, because the project lints with Biome, which does not
run ESLint plugins.

## Consequences

- Boundaries are machine-checked: a violation fails the build, not a review.
- Features are testable in isolation; a widget composes entities/features without
  reaching sideways.
- New surfaces (e.g. mission-control) slot in as a page over a widget over an
  entity, following the same shape every time.
- Slight ceremony overhead (public-API barrels per slice) is accepted as the cost
  of enforceable structure.
