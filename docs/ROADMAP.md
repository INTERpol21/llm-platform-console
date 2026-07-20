# Roadmap

What's done, what's next, and why — for the whole platform (four backends + this
console). Companion to the [ADRs](adr/README.md): ADRs record decisions already
made; this file records work not yet done. Effort tags: **S** ≈ hours, **M** ≈ a
day, **L** ≈ multiple days.

## Status snapshot (delivered)

- **Backends (M1–M3):** layered-skeleton refactor of all four; uv+lock, mypy gate,
  structured JSON logs + `X-Request-ID`, non-root Docker + HEALTHCHECK, security
  CI (pip-audit, bandit, CodeQL, Dependabot).
- **Features:** gateway model catalog + ping + Chinese/Ollama providers;
  orchestrator SSE research + Postgres/Memory checkpointer + history + model
  passthrough; rag DB opts (indexes, HNSW, dim-guard, batch upsert) + local-first
  source tags + file ingest (md/txt/pdf/docx); rich telemetry (Postgres
  `model_runs`/`research_runs`); hardening (idempotency, cursor pagination,
  circuit breaker, per-hop timeouts).
- **Security:** untrusted-context fencing + defang (LLM01/08); a promptfoo
  OWASP-LLM gate on the RAG synthesis boundary (`rag/evals/promptfoo`).
- **Console (M4):** six sections (Research, Models, Usage, Knowledge, Telemetry,
  Mission-control), strict FSD (Steiger), CSS Modules, i18n RU/EN, Kubb contracts,
  Hono BFF; unified `/v1` across services.
- **Quality:** jsdom axe a11y gate + Playwright e2e harness; deps current
  (Biome 2, Vite 8, Vitest 4, Zod 4, Kubb 4, React 19); ADRs (10) + CONTRIBUTING
  in every repo.

## Now — unblock and close out (small actions)

- [x] **Publish the console repo & push.** Done — the repo is at
      `INTERpol21/llm-platform-console` and `main` is pushed.
- [ ] **Run the umbrella e2e for real.** Playwright + axe are wired
      (`web/e2e`, CI `e2e` job) but the sandbox proxy blocks Docker Hub's blob CDN
      (CloudFront 403), so `docker compose up --build` can't pull base images.
      Runs where Docker Hub is reachable (GitHub CI on the first PR). **Size:** S
      (verify), then keep green.

## Next — real features (prioritized)

- [ ] **Folder connector (local-first).** Watch a local folder/volume, incrementally
      sync by content-hash/mtime (dedup already exists), auto-index new/changed
      files, and remove a file's chunks on delete (cascade). **Why:** the plan's
      local-first story is only half-done without ingest-from-disk. **Where:**
      `rag-pgvector/app/services` (a watcher + `ingest_documents` reuse) + a compose
      mount. **Size:** M.
- [ ] **Event-bus + live console updates.** A lightweight in-process event bus
      (ingest progress, new research run, model ping/status) surfaced to the console
      as an SSE feed through the BFF, so Mission-control and Knowledge push live
      instead of polling. **Where:** backends emit → BFF `/api/events` passthrough →
      web `entities/service-health` + a new `entities/activity`. **Size:** L.
- [ ] **GitHub branch/CI status in Mission-control.** Read-only: show each repo's
      default-branch CI status and open PRs next to the roadmap. **Where:** BFF
      proxies the GitHub API (token server-side) → a `mission-control` widget.
      **Size:** M.
- [ ] **Trivy image scan in CI.** Add image/filesystem CVE scanning to complement
      pip-audit/bandit/CodeQL. **Where:** a CI job per repo (and the console).
      **Size:** S.
- [ ] **Semantic answer cache.** Beyond the gateway's exact-match cache, cache by
      embedding similarity for near-duplicate questions, invalidated on ingest.
      **Where:** `gateway/app/services/cache` + `rag`. **Size:** M.

## Later — post-MVP (from the plan's roadmap)

- [ ] **Full OpenTelemetry** (traces + metrics across services + BFF; Prometheus /
      Grafana) on top of the existing correlation-id. **Size:** L.
- [ ] **Shared Python contract models** — dedupe the OpenAI schema currently
      repeated across backends. **Size:** M.
- [ ] **Production embeddings** (OpenAI / BGE) and a larger corpus, past the offline
      deterministic embedder. **Size:** M.
- [ ] **Multitenancy & quotas** instead of `demo-key`, plus human-in-the-loop for
      sensitive tool actions. **Size:** L.
- [ ] **Cost budgets & alerts** per key/model. **Size:** M.
- [ ] **Checkpointer retention** — TTL/cleanup + backups for the growing
      `orchestrator` and `telemetry` tables (idempotency keys especially). **Size:** M.
- [ ] **Model comparison side-by-side** + conversation export. **Size:** M.
- [ ] **Load tests (k6)** on the hot paths. **Size:** M.
- [ ] **CI/CD & deploy** (Helm/k8s or Fly/Render; secrets via a vault;
      dev/staging/prod). **Size:** L.

## Known constraints (environment, not code)

- The dev sandbox runs a Docker daemon but its egress proxy blocks Docker Hub's
  blob CDN — image pulls 403, so the umbrella stack builds only where Docker Hub
  is reachable (developer laptop, GitHub CI).
- The GitHub integration has push access to existing repos but not repo-creation;
  new repos must be created by a human first.
