# llm-platform-console

A web console over the four-service LLM platform — the "fifth project" that makes
the platform's work **visible**: a research chat with a live agent trace, a model
catalog with reachability pings, usage/cost, and a local-first knowledge base.

```
browser ──► Caddy (single origin :8080)
               ├── /            → SPA static (web/)
               └── /api/*       → BFF (Hono) ──► gateway :8080       /v1/*
                                              ├─► rag :8081          /v1/ingest /v1/query /v1/stats
                                              └─► orchestrator :8083 /v1/research(/stream) /v1/research/history
```

The backends have **no CORS** and hold **no browser-safe keys**. The browser talks
to one origin (Caddy); the BFF injects the platform bearer keys and proxies —
passing SSE through untouched so the agent trace streams live.

## Layout (pnpm workspaces)

| Path | What |
|---|---|
| `packages/contracts` | Real OpenAPI snapshots of the 3 HTTP backends + **Kubb-generated** TS types & Zod schemas — one source of truth, no schema drift. |
| `bff` | Hono BFF: key injection, correlation-id, rate-limit, transparent SSE proxy. |
| `web` | Vite SPA (React 19, **strict Feature-Sliced Design**, **CSS Modules**, i18n RU/EN). |
| `docker-compose.yml` + `infra/` | Durable umbrella: Postgres (pgvector) + Redis + 4 backends + BFF + Caddy. |

## Run the whole platform (offline, mock models)

The four backend repos must sit next to this one (`../llm-gateway`, `../rag-pgvector`,
`../mcp-tools-server`, `../agent-orchestrator`).

```bash
cp .env.example .env
docker compose up --build          # open http://localhost:8080
docker compose --profile full up   # also start Ollama for real local models
```

Durable state (Postgres, Redis) lives in named volumes and survives `down`.
Real providers stay `not_configured` until you add keys to `.env`
(`OPENAI_/DEEPSEEK_/MOONSHOT_/DASHSCOPE_API_KEY`).

## Develop

```bash
pnpm install
pnpm contracts        # regenerate types/Zod from packages/contracts/openapi/*.json
pnpm dev:bff          # Hono BFF on :8787
pnpm dev:web          # Vite dev server on :5173 (proxies /api → :8787)
pnpm -r typecheck && pnpm -r test && pnpm lint
```

Refresh a contract snapshot from a running/importable backend, then regenerate:

```bash
# from the backend repo: python -c "import json;from app.main import create_app;\
#   json.dump(create_app().openapi(), open('spec.json','w'))"
# copy into packages/contracts/openapi/<service>.json and run `pnpm contracts`.
```

## Conventions

- **Styling:** CSS Modules + design tokens (`web/src/app/styles/tokens.css`), light/dark
  via `data-theme` + `prefers-color-scheme`. No Tailwind, no component kits; Radix
  primitives skinned with our own `.module.css`.
- **Architecture:** strict FSD (`app → pages → widgets → features → entities → shared`),
  enforced by **Steiger** (`pnpm --filter @console/web lint:fsd`).
- **Types/mocks:** generated from OpenAPI (Kubb) — never hand-edit `generated/`.

## Sections

- **Research** — `POST /api/orchestrator/research/stream` (SSE): live plan→execute→
  reflect→synthesize trace, then a grounded answer with clickable `[n]` citations
  and evidence; model selector; local-first mode.
- **Models** — `/api/gateway/v1/models/catalog` cards with provider, status,
  fallbacks, context window, pricing; per-card reachability **ping**.
- **Usage** — `/api/gateway/v1/usage`: requests/tokens/USD cost per model (Recharts).
- **Knowledge** — ingest documents + `/api/rag/query` with source-badged chunks +
  `/stats` panel.
- **Telemetry** — per-call model runs (`/api/gateway/v1/model-runs`) and per-run
  research telemetry (`/api/orchestrator/v1/research/runs`): what was fed → steps →
  result → stats, cursor-paginated.
- **Mission control** — live health/readiness of all four backends + the BFF
  (polled through the single origin) and the M1–M5 delivery roadmap with status.

## Обзор платформы

This repo is the console. For the whole five-repo platform — what each service
does, how they connect, and how to run them together — see
[docs/PLATFORM_OVERVIEW.md](docs/PLATFORM_OVERVIEW.md).

## Architecture decisions & roadmap

The platform-wide ADRs (polyrepo+contracts, single Postgres/schemas, checkpointer,
FSD, backend skeleton, Kubb, unified `/v1`, single-origin BFF, prompt-injection
fencing, CSS Modules) live in [`docs/adr/`](docs/adr/README.md). What's shipped and
what's next — prioritized — is in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Status

M4 delivered: monorepo, contracts (Kubb) codegen, Hono BFF, and the web app with
all six sections above — strict FSD (Steiger), CSS Modules, i18n RU/EN. Console
CI (Biome + Steiger + typecheck + Vitest + build + contracts-in-sync) is wired
(`.github/workflows/ci.yml`). Typing is end-to-end: backend responses are named
schemas, so the frontend consumes real generated types (no open-object stubs).
The API is unified under `/v1` across services, the Mission-control section is in,
and the ADRs are written.

**Accessibility is gated two ways:** a fast **axe** pass runs in the unit suite
(jsdom, DOM-inspectable rules) on every push, and a live-browser **Playwright +
axe** e2e (`web/e2e/`, `pnpm --filter @console/web test:e2e`) runs against the
umbrella stack in the `e2e` CI job — it drives boot → route → streamed research
→ a11y scan. The unit gate needs no services; the e2e job brings the stack up
with `docker compose --wait` (needs Docker Hub reachable).

Remaining (M5): running the e2e job in an environment where Docker Hub base
images are pullable, and wiring the backend promptfoo (OWASP-LLM) eval into CI.
Dependencies are current as of 2026-07 (Biome 2, Vite 8, Vitest 4, Zod 4 + Kubb 4,
React 19); TypeScript is held at 5.9 until the tsgo/TS7 toolchain certifies.

> Versions target the plan's stack (React 19, Vite, TanStack Router/Query, Zod).
> TypeScript is pinned to a stable 5.x for a reliable build; a TS 7 bump is tracked.
