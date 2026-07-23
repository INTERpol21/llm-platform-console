# Roadmap

What's done, what's next, and why — for the whole platform (four backends + this
console). Companion to the [ADRs](adr/README.md): ADRs record decisions already
made; this file records work not yet done. Effort tags: **S** ≈ hours, **M** ≈ a
day, **L** ≈ multiple days.

Done items stay in place, struck through — the history of what it took is part
of the story this repo tells.

## Status snapshot (delivered)

- **Backends (M1–M3):** layered-skeleton refactor of all four; uv+lock, mypy gate,
  structured JSON logs + `X-Request-ID`, non-root Docker + HEALTHCHECK, security
  CI (pip-audit, bandit, CodeQL, Dependabot).
- **Features:** gateway model catalog + ping + Chinese/Ollama providers +
  `/v1/embeddings`; orchestrator SSE research + Postgres/Memory checkpointer +
  history + model passthrough; rag DB opts (indexes, HNSW, dim-guard, batch
  upsert) + local-first source tags + file ingest (md/txt/pdf/docx); rich
  telemetry (Postgres `model_runs`/`research_runs`); hardening (idempotency,
  cursor pagination, circuit breaker, per-hop timeouts).
- **Security:** untrusted-context fencing + defang (LLM01/08); a promptfoo
  OWASP-LLM gate on the RAG synthesis boundary (`rag/evals/promptfoo`).
- **Console (M4):** six sections (Research, Models, Usage, Knowledge, Telemetry,
  Mission-control), strict FSD (Steiger), CSS Modules, i18n RU/EN, Kubb contracts,
  Hono BFF; unified `/v1` across services.
- **Quality:** jsdom axe a11y gate + Playwright e2e; deps current as of 2026-07
  (TypeScript 7, Node 26, Python 3.14 images, React 19, Vite 8, Vitest 4, Zod 4,
  Kubb 4, pnpm 11 pinned via `packageManager`); ADRs (11) + CONTRIBUTING +
  CLAUDE.md agent maps in every repo.
- **Runs for real (2026-07-20):** the whole 8-container stack builds and comes up
  healthy on a laptop, with `scripts/platform_smoke.py` green 10/10 both direct
  and through Caddy+BFF. Getting there took six fixes that no unit suite caught,
  because every suite mocks its neighbours: two lockfile/dependency drifts, a
  missing `/v1` in the orchestrator's RAG client (every retrieval 404'd, and the
  agent degraded quietly into evidence-free answers), and three pnpm 11
  breakages that had left the BFF and web images never-built.
- **Toolchain current + releases automated (2026-07-21):** TypeScript 5.9→7,
  Node 22→26, Python 3.10→3.14, redis-py 5→8 — verified by building and driving
  the live stack, which surfaced two real console bugs on the first-ever
  Playwright run (the SSE parser dropped every real orchestrator frame; two
  WCAG-AA contrast failures). All five repos released as v1.0.0; tagging is now
  automatic from the manifest version (tag-release.yml), with CHANGELOG sections
  as release notes.
- **Code-level audit (2026-07-23):** multi-agent survey produced a CLAUDE.md map
  per repo and a verified finding list. Fixed: Unicode-blind retrieval in rag
  (any Russian corpus 500'd BM25 *and* embedded to the zero vector),
  `EMBEDDING_DIM` ignored by the openai embedder, an asyncpg pool leak on the
  fail-fast path, MCP error paths leaking absolute server paths, a healthcheck
  blind to `MCP_PORT`, unlogged tool rejections, dead code, and a stack of
  README/config drift (stale base images, test counts, env examples, ruff pins).

## ~~Now — unblock and close out~~ Closed out (kept for history)

- [x] ~~**Publish the console repo & push.**~~ Done — the repo is at
      `INTERpol21/llm-platform-console` and `main` is pushed.
- [x] ~~**Bring the stack up for real.**~~ Done 2026-07-20 — see the delivered
      snapshot for what it found.
- [x] ~~**Run the browser e2e for real.**~~ Done 2026-07-21 — first-ever run
      found two real bugs (SSE wire-format mismatch, WCAG-AA contrast); 4/4
      green locally and in CI since.
- [x] ~~**Cover the cross-service links in CI.**~~ Done — `platform_smoke.py`
      runs in the `e2e` job; each backend fails CI when `requirements.txt`
      drifts from `uv.lock`. Between them these gates reproduce every defect
      the first real run turned up.
- [x] ~~**Tag releases.**~~ Done, then automated: all five repos carry v1.0.0
      and tag-release.yml cuts every future release from the manifest version.
- [x] ~~**`/v1/embeddings` passthrough (gateway).**~~ Route shipped with the
      completions routing/fallbacks/breakers/cost accounting. The rag half
      moved to *Consolidate* below.

## Now — consolidate what exists (priority 1)

The platform works end-to-end. Before growing it, make what exists boringly
solid: close the halves, wire the skipped tests, and finish the stories the
audit opened.

- [ ] **rag: `gateway` embedder backend.** The other half of `/v1/embeddings`:
      let rag fetch vectors through the gateway (`EMBEDDINGS_BACKEND=gateway`)
      instead of embedding in-process, so the whole platform sits behind one
      entrypoint with one usage/cost ledger. **Where:**
      `rag-pgvector/app/services/embeddings.py` (an `OpenAIEmbedder` pointed at
      the gateway is 90% of it) + compose env. **Size:** S.
- [ ] **rag: real multilingual retrieval.** The audit fixed Unicode
      tokenization, but "поиск" still won't match "поиске": no stemming or
      fuzzy matching in the memory BM25 leg, and the Postgres leg uses the
      `simple` FTS config. Evaluate: `russian`/language-aware FTS configs per
      corpus, or pg_trgm similarity as the keyword leg. Add a small Russian
      eval corpus so `make eval` guards it. **Where:** `rag-pgvector/app/db/`
      + `evals/`. **Size:** M.
- [ ] **rag: run the 9 skipped pgvector tests in CI.** The integration tests
      for the real store never run anywhere — CI has no Postgres. Add a
      `pgvector/pgvector:pg16` service container to the test job and set
      `DATABASE_URL`. **Why:** the store is the least-tested layer with the
      most SQL in it. **Size:** S.
- [ ] **gateway: finish the route `kind` story.** `/v1/embeddings` resolves
      aliases with `kind='chat'`, so an alias declared `kind: embedding` is
      rejected by the very endpoint it is for (documented in CLAUDE.md).
      Decide the semantics (accept both kinds on /v1/embeddings, or add
      embedding aliases + strict kind), wire `kind` through
      `execute_embeddings`, and cover it with tests — without breaking the
      mock-model demo path the smoke relies on. **Size:** M.
- [ ] **orchestrator: parallel independent plan steps.** Steps run sequentially;
      `asyncio.gather` over independent ones cuts research latency on
      multi-step plans. **Where:** the step loop in
      `agent-orchestrator/app/services/graph`. **Size:** M.
- [ ] **mcp: bearer auth on streamable-http.** The tools are reachable by
      anyone who can hit the port (deliberate for the offline demo, now a
      recorded risk). Gate behind the same `demo-key` layer as the other
      services; stdio stays open. **Where:** `mcp-tools-server/app/server.py`.
      **Size:** M.
- [ ] **CI: test on the production Python.** Images run 3.14; CI resolves
      whatever Python the runner has. Pin `uv` to 3.14 in the test jobs (or a
      `.python-version`) so the tested interpreter is the shipped one.
      All four backends. **Size:** S.
- [ ] **One-command verify.** `make verify` at the portfolio root: compose up →
      smoke (both modes) → e2e → down. Every session this week rebuilt that
      pipeline by hand. **Where:** a root Makefile/script in the console repo.
      **Size:** S.
- [ ] **Console: feed Mission-control from reality.** RoadmapPanel's M1–M5
      statuses are hardcoded in the widget; this file is the source of truth.
      Parse ROADMAP.md (served via BFF) or the GitHub API into the panel so the
      console stops contradicting the repo. Pairs naturally with the
      GitHub-status widget below. **Size:** M.

## Next — new capabilities (priority 2)

- [ ] **Folder connector (local-first).** Watch a local folder/volume,
      incrementally sync by content-hash/mtime (dedup already exists),
      auto-index new/changed files, and remove a file's chunks on delete
      (cascade). **Why:** the local-first story is only half-done without
      ingest-from-disk. **Where:** `rag-pgvector/app/services` (a watcher +
      `ingest_documents` reuse) + a compose mount. **Size:** M.
- [ ] **Event-bus + live console updates.** A lightweight in-process event bus
      (ingest progress, new research run, model ping/status) surfaced to the
      console as an SSE feed through the BFF, so Mission-control and Knowledge
      push live instead of polling. **Where:** backends emit → BFF
      `/api/events` passthrough → web `entities/service-health` + a new
      `entities/activity`. **Size:** L.
- [ ] **GitHub branch/CI status in Mission-control.** Read-only: each repo's
      default-branch CI status and open PRs next to the roadmap. **Where:** BFF
      proxies the GitHub API (token server-side) → a `mission-control` widget.
      **Size:** M.
- [ ] **Trivy image scan in CI.** Image/filesystem CVE scanning to complement
      pip-audit/bandit/CodeQL — and to partly repay the supply-chain window
      opened by disabling `minimumReleaseAge` (ADR-0011). **Size:** S.
- [ ] **Semantic answer cache.** Beyond the gateway's exact-match cache, cache
      by embedding similarity for near-duplicate questions, invalidated on
      ingest. Depends on the `gateway` embedder backend above. **Where:**
      `gateway/app/services/cache` + `rag`. **Size:** M.
- [ ] **Research sessions in the console.** The orchestrator already keeps
      checkpointed history per thread (`/v1/research/history`); the console
      starts a fresh thread every time. Thread picker + follow-up questions on
      an existing thread turns the demo into a usable research tool. **Size:** M.

## Later — post-MVP

- [ ] **Full OpenTelemetry** (traces + metrics across services + BFF;
      Prometheus / Grafana) on top of the existing correlation-id. **Size:** L.
- [ ] **Shared Python contract models** — dedupe the OpenAI schema repeated
      across backends. **Size:** M.
- [ ] **Production embeddings** (OpenAI / BGE) and a larger corpus, past the
      offline deterministic embedder. **Size:** M.
- [ ] **Multitenancy & quotas** instead of `demo-key`, plus human-in-the-loop
      for sensitive tool actions. **Size:** L.
- [ ] **Cost budgets & alerts** per key/model. **Size:** M.
- [ ] **Checkpointer retention** — TTL/cleanup + backups for the growing
      `orchestrator` and `telemetry` tables (idempotency keys especially).
      **Size:** M.
- [ ] **Model comparison side-by-side** + conversation export. **Size:** M.
- [ ] **Load tests (k6)** on the hot paths. **Size:** M.
- [ ] **CI/CD & deploy** (Helm/k8s or Fly/Render; secrets via a vault;
      dev/staging/prod). **Size:** L.

## Known constraints (environment, not code)

- The cloud dev sandbox runs a Docker daemon but its egress proxy blocks Docker
  Hub's blob CDN — image pulls 403 there. On a developer laptop and in GitHub
  CI, all eight images build and run (verified repeatedly since 2026-07-20).
- In the umbrella stack the backends are **not** published on the host: Caddy
  owns `:8080` and everything else is reached through it via the BFF. To hit a
  backend directly (e.g. for the smoke script's `--direct` mode) publish its
  port with a compose override; `SMOKE_*_PORT` env vars let the script follow a
  remapped port when another local dev server already owns 8080-8083.
- The GitHub integration has push access to existing repos but not
  repo-creation; new repos must be created by a human first.
