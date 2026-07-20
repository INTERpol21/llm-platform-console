# llm-platform-console

A web console over the four-service LLM platform — the "fifth project" that makes
the platform's work **visible**: a research chat with a live agent trace, a model
catalog with reachability pings, usage/cost, and a local-first knowledge base.

```
browser ──► Caddy (single origin :8080)
               ├── /            → SPA static (web/)
               └── /api/*       → BFF (Hono) ──► gateway :8080  /v1/*
                                              ├─► rag :8081     /ingest /query /stats
                                              └─► orchestrator :8083  /research(/stream) /research/history
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

## Status

M4 in progress: foundation, contracts codegen, BFF, and the web scaffold with the
Models and Research sections. Usage and Knowledge sections, umbrella e2e, and the
full CI gate (Vitest/RTL/Playwright/axe/Steiger) land next (M5).

> Versions target the plan's stack (React 19, Vite, TanStack Router/Query, Zod).
> TypeScript is pinned to a stable 5.x for a reliable build; a TS 7 bump is tracked.
