# 10. CSS Modules + Radix primitives, not Tailwind

Status: **Accepted**

## Context

The console needs a consistent, themeable "blueprint" look (light/dark),
accessible interactive primitives, and styling that co-locates with components
under FSD — without pulling in a heavy component kit or a utility-CSS paradigm the
team didn't want.

## Decision

Style with **CSS Modules** plus design tokens as CSS custom properties in
`shared/styles/tokens.css`; light/dark via `data-theme` + `prefers-color-scheme`.
Interactive primitives come from **Radix UI** (unstyled, accessible), skinned with
our own `.module.css`. No Tailwind, no utility classes, no shadcn/MUI. Icons from
lucide-react.

## Consequences

- Styles co-locate with components (`<Component>.module.css`) and scope
  automatically, fitting FSD.
- Accessibility (focus, ARIA, keyboard nav) comes from Radix rather than
  hand-rolled behaviour; axe checks are tracked for CI.
- Theming is centralized in tokens; a component never hard-codes a colour.
- Contributors write real CSS rather than utility strings — more verbose per
  component, but no build-time utility layer and no class-name churn.
