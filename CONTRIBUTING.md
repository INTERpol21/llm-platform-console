# Contributing — llm-platform-console

pnpm-workspace monorepo: `packages/contracts` (OpenAPI → Kubb codegen), `bff`
(Hono), `web` (Vite SPA, strict FSD, CSS Modules, i18n RU/EN).

## Setup

```bash
pnpm install
pnpm contracts        # regenerate types/Zod from packages/contracts/openapi/*.json
pnpm dev:bff          # Hono BFF on :8787
pnpm dev:web          # Vite dev server on :5173 (proxies /api → :8787)
```

## Gates (all must be green before a PR)

```bash
pnpm exec biome check .              # lint + format
pnpm --filter @console/web lint:fsd  # Steiger (FSD boundaries)
pnpm -r typecheck                    # tsc across workspaces
pnpm -r test                         # Vitest (unit + jsdom axe a11y)
pnpm --filter @console/web build     # vite build
```

The **contracts must stay in sync**: CI runs `pnpm contracts` and fails on a diff
under `packages/contracts/src`. Regenerate and commit after refreshing a snapshot.

E2E (`web/e2e/`, Playwright + live-browser axe) runs against the umbrella
`docker compose` stack in the `e2e` CI job — it needs the backends as siblings
and Docker Hub reachable, so it is separate from the unit gate:

```bash
docker compose up -d --build --wait
E2E_BASE_URL=http://localhost:8080 pnpm --filter @console/web test:e2e
```

## Architecture — strict Feature-Sliced Design

Layers `app → pages → widgets → features → entities → shared`; imports only flow
downward, slices in the same layer don't import each other, each slice exposes a
public API through its `index.ts`. **Steiger enforces this in CI.**

```
web/src/
  app/       # providers (router, QueryClient, i18n, theme), router, layout
  pages/     # route components composing widgets
  widgets/   # research-console · model-catalog · usage-dashboard · knowledge-manager
             #   · telemetry-explorer · mission-control · app-nav
  features/  # ask-research · select-model · ping-model · ingest-documents · …
  entities/  # model · research · research-run · model-run · usage · document · service-health
  shared/    # api (client, sse) · ui (Radix + CSS-Modules kit) · lib · i18n · styles
```

## Conventions

- **Types come from the contracts** (Kubb): never hand-edit `packages/contracts/src`
  and never hand-write API types — regenerate. The frontend consumes real
  generated types + Zod schemas (no open-object stubs).
- **Styling:** CSS Modules + design tokens (`shared/styles/tokens.css`), light/dark
  via `data-theme` + `prefers-color-scheme`. No Tailwind, no component kits; Radix
  primitives skinned with our own `.module.css`.
- **i18n:** every user-facing string goes through `react-i18next`; keep `en.ts` and
  `ru.ts` in sync (RU is typed against EN, so a missing key fails typecheck).
- **Security:** the browser talks only to the single Caddy origin; platform bearer
  keys live in the BFF/backend env and never reach the client. No
  `dangerouslySetInnerHTML`.
- **Accessibility:** the jsdom axe gate runs in `pnpm -r test`; keep it green.
  Content panels are `<section>`, forms have labels, interactive elements are
  reachable and named.
- **Tests:** behaviour through the rendered UI (RTL + user-events); mock the
  network at `fetch`/MSW; one behaviour per test; a regression test for every fix.
  Don't test trivial glue.

## Commits & branches

Small, focused commits with a clear subject line. Develop on a feature branch and
open a PR against `main`; keep every gate green.
