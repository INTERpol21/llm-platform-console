# Roadmap

> Checkbox convention: `- [ ]` planned, `- [~]` **in progress right now**,
> `- [x]` done (struck through, with date and release). The Mission-control
> panel renders this file live from `main`, so status edits here show up in
> the console within a minute of merging.

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

- [x] ~~**rag: `gateway` embedder backend.**~~ Done 2026-07-23 (rag 1.1.0): the
      umbrella stack embeds through the gateway's `/v1/embeddings`, so
      completions, research and embeddings share one usage/cost ledger. The
      smoke asserts the new link: with `embeddings=gateway` the gateway ledger
      must grow after a rag query.
- [x] ~~**rag: real multilingual retrieval.**~~ Done 2026-07-23 (rag 1.2.0):
      Snowball stemming across all three legs — Postgres FTS on the `russian`
      config (Cyrillic via russian_stem, ASCII via english_stem), the memory
      BM25 leg and offline embedders on the identical algorithms via
      `snowballstemmer` (stems verified equal to Postgres's). Guarded by a
      textnorm suite pinned to Postgres output, an inflected-query pgvector
      integration test, and a Russian eval corpus. Verified live end to end.
- [x] ~~**rag: run the skipped pgvector tests in CI.**~~ Done 2026-07-23: a
      `pgvector/pgvector:pg16` service container backs the test job — 87 tests,
      zero skips, and the job fails loudly if the pgvector skip reason ever
      reappears.
- [x] ~~**gateway: finish the route `kind` story.**~~ Done 2026-07-23
      (gateway 1.1.0). Policy: /v1/embeddings serves both kinds
      (multi-capability chat aliases + dedicated `kind: embedding` aliases —
      `text-embedding-3-small` with a mock fallback ships in models.yaml);
      /v1/chat/completions rejects embedding aliases with a plain-words 404.
      The mock demo path is untouched; verified live and by 3 new tests.
- [x] ~~**orchestrator: parallel independent plan steps.**~~ Done 2026-07-23
      (orchestrator 1.1.0): execute fans all remaining plan steps out with
      asyncio.gather — safe because reflect only appends follow-ups after the
      node; results collect in plan order so traces and citation numbering
      stay deterministic; per-step degradation survives the fan-out. Guarded
      by a rendezvous test that deadlocks under sequential execution.
- [x] ~~**mcp: bearer auth on streamable-http.**~~ Done 2026-07-23
      (mcp-tools-server 1.1.0 + agent-orchestrator 1.2.0): /mcp requires
      `Authorization: Bearer` with a key from `MCP_API_KEYS` (constant-time,
      401 + WWW-Authenticate otherwise); the orchestrator client sends
      `MCP_API_KEY`; both default to the platform's shared `demo-key` and the
      umbrella compose wires `PLATFORM_KEY` into each. stdio stays open —
      its client is whoever spawned the process.
- [x] ~~**CI: test on the production Python.**~~ Done 2026-07-23: setup-uv pins
      python-version 3.14 in every backend job, after a local 3.14 run of all
      four suites proved green first.
- [x] ~~**One-command verify.**~~ Done 2026-07-23: `make verify` (and
      `make verify E2E=1`) in the console repo — stack up on a configurable
      port (8080 is habitually taken locally), smoke, optional Playwright,
      guaranteed teardown via trap.
- [x] ~~**rag: re-embed on backend switch.**~~ Done 2026-07-24 (rag 1.3.0):
      embedders carry a vector-space fingerprint (model+dim, deliberately not
      URL — gateway vs direct with the same model does not re-embed); the
      store records it (pgvector: index_meta, migration 008) and startup
      re-embeds the whole corpus on mismatch before serving traffic.
      Pre-fingerprint stores are adopted as-is. Verified live in the umbrella
      stack: model switch logged reembedded:3 both ways, smoke 10/10.
- [x] ~~**Console: feed Mission-control from reality.**~~ Done 2026-07-24
      (console 1.1.0): RoadmapPanel now renders THIS file — sections and
      checkboxes parsed from docs/ROADMAP.md at build time via a Vite ?raw
      import (no endpoint, no fetch; every roadmap change ships through an
      image rebuild anyway). The hardcoded M1-M5 board and its i18n keys are
      gone. The GitHub-status widget below remains a natural pairing.

## Design track — M7 (runs separately from backend work)

Decided 2026-07-24: visual redesign and console UX gaps are one dedicated
track, kept apart from backend milestones so neither blocks the other.

- [ ] **Console: calm-minimalism redesign.** A design critique of the live UI
      (2026-07-23) named the dirt: the graph-paper background fights the
      content in both themes, and monospace leaks from data into headings —
      "hacker dashboard" instead of an operator console. Direction chosen:
      Linear/Geist-style calm minimalism — no background grid, surface layers
      instead of border-boxes, mono only for data (numbers, model ids, trace),
      a 32/16 spacing scale, one accent, one badge style. All in tokens.css +
      module CSS; axe/e2e gates already guard contrast. **Size:** M.
- [ ] **Console: expose what the backends already do.** Found by walking the
      deployed UI: no file upload in Knowledge (the rag `/v1/ingest/file`
      endpoint — md/txt/pdf/docx — has no UI), no document list or delete
      (needs a small rag listing endpoint too), and mcp-tools-server is absent
      from the Mission-control health board (the BFF has no mcp probe — it can
      be down while the board is all green). **Size:** M.
- [x] ~~**Live roadmap in Mission control.**~~ Done 2026-07-24 (console
      1.2.0): the panel fetches this file from main via the BFF
      (`/api/roadmap`, 60 s cache) and refreshes every minute; `- [~]` items
      render as "In progress". Plan edits are visible online, no rebuild.
- [ ] **Console hardening (found by the 2026-07-24 frontend audit).**
      Ping failures are swallowed (`usePingModel` has no onError — a dead
      model looks like "nothing happened"); numeric inputs ship raw
      `Number(...)` to the API (top_k / priority / max_iterations can be NaN
      or out of range); no route code-splitting or manualChunks, so recharts,
      both locales and the full Zod contract trees load eagerly (the vite
      chunk-size warning); `useResearchStream`, `shared/api/client.ts` and
      the ingest/search forms have zero direct tests. **Size:** M.

## Scale-out track — M8 (next major backend theme)

Decided 2026-07-24 after a scaling audit of all five services. Today
everything is single-process and single-replica; the platform Postgres and
Redis are shared, but resilience state is not. Order matters: correctness
first (a, b), then caps (c), then actual replicas (e).

Plan of record (2026-07-24, three phases): **Phase 1** = (c), (d), (g) —
hardening that is also a prerequisite for a public demo; **Phase 2** = the
Public demo track below; **Phase 3** = the Design track above. (e) replicas
and (f) k6 are deliberately deferred until the public stand exists — load
numbers and replica stories only mean something against something reachable.

- [x] ~~**(a) umbrella: durable orchestrator.**~~ Resolved 2026-07-24 as
      already true: the audit claim was wrong — the umbrella compose DOES set
      `ORCH_DATABASE_URL` (checkpoints in the `orchestrator` schema).
      Verified live: a research thread's `/research/history` returned
      `exists: true` after a container restart. No code change needed.
- [x] ~~**(b) gateway: shared resilience state.**~~ Done 2026-07-24 (gateway
      1.2.0): Redis-backed circuit breakers — TTL trip/cooldown, exactly one
      HALF_OPEN probe fleet-wide via SET NX, fail-open when Redis is down;
      REDIS_REQUIRED fail-fast (the umbrella sets it) and ERROR-level
      DEGRADED logs instead of the old silent warning; telemetry INSERT moved
      off the hot path (bounded fire-and-forget, flushed on shutdown);
      telemetry pool exposed as TELEMETRY_POOL_MIN/MAX_SIZE.
- [x] ~~**(c) platform: request caps + auth unification.**~~ Done 2026-07-24
      (rag 1.4.0, orchestrator 1.3.0, mcp 1.1.1, console 1.4.0): Content-Length
      413 gates in rag (10 MiB) and the orchestrator (1 MiB), hono bodyLimit
      in the BFF (12 MiB, also counts chunked streams); rag and mcp key
      comparison made non-short-circuiting — the whole platform now keeps the
      strict timing-safe contract. Verified live: 413s at every layer, normal
      traffic and smoke 10/10 intact. Note: the header-based caps are
      advisory against lying clients — the enforced bound remains the schema
      limits (BFF's stream counter is the exception).
- [ ] **(h) hardening backlog from the 2026-07-24 adversarial audit** of the
      freshly shipped mechanisms (fix-now items already landed as gateway
      1.2.1, rag 1.4.1, orchestrator 1.3.1). Remaining, in rough order:
      BFF /api/roadmap — single-flight for the cold-cache stampede, a size cap
      + redirect policy on the outbound fetch, and moving it off the shared
      per-IP token budget; telemetry flush deadline on shutdown (256 stuck
      writes x pool timeout can stall stop); live/baked roadmap flip-flop
      damping in the panel. **Size:** S each.
- [ ] **(d) hot-path connection reuse + pool knobs.** rag builds a fresh
      `httpx.AsyncClient` twice per query (embed + synthesize) and the
      orchestrator once per node call; gateway providers and the BFF already
      pool. Share clients via app.state/lifespan. Expose rag's hardcoded
      asyncpg pool (1-5) as env knobs like the orchestrator already does.
      **Size:** M.
- [ ] **(e) replicas for real.** compose `--scale` for gateway/rag behind
      Caddy load-balancing, `WEB_CONCURRENCY`/`--workers` knob in the
      uvicorn CMDs, BFF rate limiter to Redis (or delegate limiting to
      Caddy), then document what N replicas actually changes. Depends on (b).
      **Size:** L.
- [ ] **(f) load tests (k6) on the hot paths** — moved up from Later: numbers
      before and after (b)-(e) are the whole point. **Size:** M.
- [ ] **(g) CI + build speed.** e2e wall-clock is ~2.5 min; the stack
      bring-up step alone is ~49 s of 10 s-interval healthcheck polling — a
      CI overlay with 2 s intervals cuts most of it. Cache the Trivy DB
      (~19 s step). The BFF image is 686 MB (full workspace dev deps) —
      `pnpm --prod` deploy or prune. Python Dockerfiles pip-install with no
      BuildKit cache mount — add `--mount=type=cache` (or uv) so dependency
      changes stop re-downloading every wheel. **Size:** M.

## Public demo track — M9 (Phase 2: make the platform visible)

Decided 2026-07-24: the portfolio's biggest gap is that nobody can SEE it —
the whole platform lives in a local compose. The stack runs fully offline on
mock models, so a public stand costs no API keys. Phase 1 hardening (M8 c/d)
is the security prerequisite: no public ingest without body caps.

- [ ] **Deploy the umbrella stack publicly** (promoted from Later). One small
      VM or Fly/Render, mock mode, the existing Caddy as the front door;
      scheduled demo-data reset; rate limits already exist. **Size:** L.
- [ ] **README showcase.** Live link, screenshots, platform diagram, a
      2-minute "what to click" tour; badges already exist. **Size:** S.
- [ ] **Demo hygiene.** Seeded corpus and example research questions so the
      first click lands on something impressive, not an empty Knowledge tab.
      **Size:** S.

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
- [x] ~~**Trivy image scan in CI.**~~ Done 2026-07-23: the e2e job (the only
      place all six images exist) gates on CRITICAL-with-a-fix; unfixable
      base-image HIGHs deliberately do not block (debian's perl carries
      perpetual ones). The first scan already paid for itself: node-tar CVE in
      the BFF image, fixed by deleting npm from the runtime image entirely —
      the container only ever invokes pnpm.
- [ ] **Semantic answer cache.** Beyond the gateway's exact-match cache, cache
      by embedding similarity for near-duplicate questions, invalidated on
      ingest. Depends on the `gateway` embedder backend above. **Where:**
      `gateway/app/services/cache` + `rag`. **Size:** M.
- [ ] **Revisit the supply-chain quarantine (ADR-0011).** Now that Trivy gates
      the images, reconsider reinstating a short `minimumReleaseAge` (e.g. 60
      minutes — most npm-takeover windows die in the first hour) and/or widening
      the Trivy gate to HIGH-with-a-fix once the base images stabilize. Both are
      one-line changes; the point is to make the decision deliberately.
      **Size:** S.
- [ ] **Slim runtime images further.** Deleting npm from the BFF image both
      killed a CVE and shrank the attack surface — the same lens applies
      elsewhere: multi-stage the BFF (install stage + runtime stage without
      pnpm), pin base images by digest, add a non-root USER to the node images
      (the Python images already have one). **Size:** M.
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
