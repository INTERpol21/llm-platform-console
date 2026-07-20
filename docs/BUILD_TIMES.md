# Build & check times

Wall-clock of the local lint/type/test gates, warm caches. Snapshot: 2026-07-20.
Refresh by re-running the gates per repo (`uv run ruff/mypy/pytest`, `pnpm …`).

## Backends (uv)

| repo | uv sync | ruff | mypy | pytest (offline) | total |
|---|---|---|---|---|---|
| llm-gateway | 0.02s | 0.03s | 0.20s | 1.35s | **1.6s** |
| rag-pgvector | 0.02s | 0.03s | 0.19s | 1.34s | **1.6s** |
| mcp-tools-server | 0.02s | 0.03s | 0.19s | 1.91s | **2.1s** |
| agent-orchestrator | 0.02s | 0.03s | 0.28s | 2.53s | **2.9s** |

Cold caches (first run) add ~1s to ruff and ~0.6s to mypy per repo. pytest here is
the offline suite; the Postgres-gated integration tests add ~1–2s each when a live
database (`DATABASE_URL` / `ORCH_DATABASE_URL` / `TELEMETRY_DATABASE_URL`) is set.

## Console (pnpm)

| step | biome | typecheck (tsc ×3) | test (vitest) | build (vite) | steiger | total |
|---|---|---|---|---|---|---|
| @console | 2.5s | 9.3s | 6.6s | 9.7s | 2.8s | **31.0s** |

`pnpm install --frozen-lockfile` (cold) is the dominant one-off cost; the numbers
above assume dependencies are already installed.
