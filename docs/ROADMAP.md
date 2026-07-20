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
- [x] **Bring the backend stack up for real.** Done on a developer laptop
      (2026-07-20): all four backends + Postgres + Redis healthy under the umbrella
      compose, and `scripts/platform_smoke.py --direct` green at 10/10. This found
      three real defects that the unit suites could not: two lockfile/dependency
      drifts (`psycopg-pool` missing from the gateway's exported
      `requirements.txt`; `psycopg` arriving without the `binary` extra in the
      orchestrator) and a missing `/v1` in the orchestrator's RAG client, which
      made every `rag_search` 404 and silently produced answers with zero
      evidence. Fixed.
- [ ] **Run the browser e2e for real.** Playwright + axe are wired (`web/e2e`, CI
      `e2e` job) but the web/Caddy image still hasn't been built: pnpm's
      `minimumReleaseAge` policy rejects a same-day `lightningcss` release, so
      `pnpm install --frozen-lockfile` fails inside the image. Clears on its own
      once the package ages past the window; re-verify then. **Size:** S (verify),
      then keep green.
- [ ] **Cover the cross-service links in CI.** The smoke script is the only thing
      that exercises service-to-service wiring; all four unit suites use fakes, so
      the `/v1` drift above shipped green. Add a CI job that boots the compose
      stack and runs `scripts/platform_smoke.py`. **Size:** S.
- [ ] **Tag `v0.1.0` + a CHANGELOG in each repo.** No repo carries a tag yet; a
      first release tag and a short changelog are a cheap signal of process
      maturity for a reader landing on the repos cold. **Size:** S.

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
- [ ] **`/v1/embeddings` passthrough (gateway).** The provider layer already has an
      `embed` method (`gateway/app/providers/base.py`), but no route exposes it, so
      `rag` still embeds in-process. Exposing it puts the whole platform behind one
      entrypoint and lets rag swap to gateway-served embeddings by config. **Where:**
      `gateway/app/api/routes/` + a rag embedder backend. **Size:** M.
- [ ] **Parallel execution of independent plan steps (orchestrator).** Steps run
      sequentially today; fanning out independent ones with `asyncio.gather` cuts
      research latency on multi-step plans. **Where:** the step loop in
      `agent-orchestrator/app/services`. **Size:** M.
- [ ] **Bearer auth on the MCP streamable-http transport.** `mcp-tools-server` is
      unauthenticated over HTTP (deliberate for the offline demo); the tools are
      reachable by anyone who can hit the port. Gate it behind the same `demo-key`
      layer as the other services. **Where:** `mcp-tools-server/app/server.py`.
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

- The cloud dev sandbox runs a Docker daemon but its egress proxy blocks Docker
  Hub's blob CDN — image pulls 403 there. On a developer laptop Docker Hub is
  reachable and the backend stack builds and runs (verified 2026-07-20); only the
  web/Caddy image is still blocked, by the pnpm release-age policy above.
- In the umbrella stack the backends are **not** published on the host: Caddy owns
  `:8080` and everything else is reached through it via the BFF. To hit a backend
  directly (e.g. for the smoke script's `--direct` mode) publish its port with a
  compose override; `SMOKE_*_PORT` env vars let the script follow a remapped port
  when another local dev server already owns 8080-8083.
- The GitHub integration has push access to existing repos but not repo-creation;
  new repos must be created by a human first.
