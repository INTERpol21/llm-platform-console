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

## Live demo

> **Public stand: coming soon.** The stack runs fully offline on mock models,
> so the public demo costs no API keys — deployment is the current roadmap
> focus (M9). Until then: two commands above bring the whole thing up locally.

**What to click (2-minute tour):**

1. **Knowledge** — the corpus is pre-seeded (`make demo-seed`). Ask in Russian
   or English: *«как объединяются результаты векторного и ключевого поиска»*
   or *"when does the circuit breaker open"* — answers come back with `[n]`
   citations into the retrieved chunks.
2. **Research** — give the agent a question: *«что такое RRF и зачем он
   нужен»*. Watch the live SSE trace: plan → parallel execute → reflect →
   synthesize, with evidence from the knowledge base and MCP web search.
3. **Mission control** — service health plus the delivery roadmap rendered
   LIVE from `docs/ROADMAP.md` on `main`; `[~]` items are literally what is
   being worked on right now.
4. **Models / Usage / Telemetry** — the catalog with reachability pings,
   per-key cost accounting, and one row per model call.
5. Drop any `.md`/`.pdf`/`.docx` into `./dropbox` — the folder connector
   ingests it within ~5 s; it becomes searchable in Knowledge.

Demo data resets with `make demo-reset` (truncates the rag tables, flushes
Redis, re-seeds the corpus) — run it on a schedule on a public stand.

## Not for production

This is a **portfolio demo platform**. `demo-key` is a shared, publicly known
bearer token: it demonstrates the auth *mechanism* (constant-time comparison,
key scoping, BFF-side injection), not real access control. There is no user
management, no tenant isolation, and telemetry/usage data is visible to every
key holder. Before anything internet-facing beyond a demo stand: set real
`PLATFORM_KEY`s, review the threat-model item in `docs/ROADMAP.md` (M9), and
keep the body caps + rate limits that ship by default.

## The platform (five repos)

| Repo | Role |
|---|---|
| [llm-gateway](https://github.com/INTERpol21/llm-gateway) | OpenAI-compatible gateway: routing/fallbacks, exact + semantic cache, Redis circuit breakers, cost ledger |
| [rag-pgvector](https://github.com/INTERpol21/rag-pgvector) | RAG: hybrid retrieval (vector + BM25/FTS via RRF), folder connector, citations |
| [mcp-tools-server](https://github.com/INTERpol21/mcp-tools-server) | MCP tools: offline search, read-only SQL, sandboxed files; bearer on HTTP |
| [agent-orchestrator](https://github.com/INTERpol21/agent-orchestrator) | LangGraph research agent: plan → parallel execute → reflect → synthesize |
| **llm-platform-console** | This repo: SPA + BFF + Caddy + the umbrella compose |
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

The promptfoo (OWASP-LLM) eval is wired into the rag repo's CI. Remaining (M5):
running the browser e2e job, which needs Docker Hub base images to be pullable.
Dependencies are current as of 2026-07: Biome 2, Vite 8, Vitest 4, Zod 4 + Kubb 4,
React 19, and **TypeScript 7** (the native `tsgo` compiler).

> Versions target the plan's stack (React 19, Vite, TanStack Router/Query, Zod).
>
> **TypeScript 7 note.** The native compiler exports only `version` and
> `versionMajorMinor` — the JS compiler API (`findConfigFile`, `readConfigFile`,
> `sys`, …) is gone. Any tool that loads a `.ts` config through cosmiconfig
> therefore fails, which is why `steiger.config` is a `.js` file. Expect the same
> for other tooling that reads tsconfig programmatically.

## Releases

Version history is in [CHANGELOG.md](CHANGELOG.md).
