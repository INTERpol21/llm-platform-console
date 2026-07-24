# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Docs roadmap review: `docs/ROADMAP.md` now has Current focus (M9 public
  demo), a Project map (ownership + working/missing linkages), M7 split into
  a/b/c by ROI, M9 threat-model/seed/smoke/pins/verify gates, and semantic
  cache v1 marked done (gateway 1.3.0) with explicit follow-ups.
  `docs/HISTORY.ru.md` version table synced to tagged releases; M10 priority
  aligned with M9. `docs/PLATFORM_OVERVIEW.md` gained the same ownership map.

## [1.4.2] - 2026-07-24

### Fixed
- `/api/roadmap` hardened: concurrent cold-cache requests share ONE upstream
  fetch (no stampede), the fetched body is capped at 1 MiB (ROADMAP_URL is
  operator-configurable — a misconfigured upstream must not buffer arbitrary
  data), and the endpoint moved before the rate limiter like `/api/health` —
  a wall of dashboard tabs polling a cached file must not eat the per-IP
  budget real API calls use.

## [1.4.1] - 2026-07-24

### Changed
- CI e2e sped up: healthchecks poll every 2 s in CI (a compose overlay; the
  10 s production cadence made stack bring-up ~50 s of pure waiting) and the
  Trivy DB is cached between runs (~15 s saved).
- BFF runtime image slimmed 686 MB -> 475 MB: `pnpm install --prod --filter
  @console/bff...` ships only the runtime tree (tsx moved to dependencies —
  it IS the runtime); the unfiltered install used to bake every workspace
  project's dev toolchain into the image.

## [1.4.0] - 2026-07-24

### Added
- BFF request-body cap: all proxied `/api/*` traffic is limited to
  `BFF_MAX_BODY_BYTES` (default 12 MiB — just above rag's 10 MiB cap so the
  backends stay authoritative) via hono's bodyLimit, which checks
  Content-Length up front and counts streamed bytes, covering chunked
  uploads the backends' header-based caps cannot see. 413 on breach, the
  upstream is never contacted.

## [1.3.1] - 2026-07-24

### Fixed
- WCAG AA regression from 1.3.0: the ok badge ("n/n done") composited over
  the new surface-2 section blocks at 4.1 contrast. Light-theme
  `--color-ok` darkened #16794a -> #146c42 (4.88 on the worst composite);
  the axe e2e gate that caught it stays the enforcement.

## [1.3.0] - 2026-07-24

### Changed
- Mission control layout: the roadmap now takes the full row below the health
  board, and its sections spread over a responsive multi-column grid, each as
  a bordered surface block — 40+ items are visible and separated instead of
  crammed into a narrow side column.

## [1.2.1] - 2026-07-24

### Fixed
- Browsers could serve a stale console for days: Caddy sent no Cache-Control,
  so index.html fell under heuristic caching and users kept old bundles after
  deploys. The SPA shell (and every non-asset response) is now `no-cache`
  (revalidated via ETag, cheap 304s); hashed `/assets/*` are
  `public, max-age=31536000, immutable`.

## [1.2.0] - 2026-07-24

### Added
- Live delivery roadmap: the Mission-control panel now fetches ROADMAP.md
  from the repo's main branch through a new BFF endpoint (`GET /api/roadmap`,
  60 s cache, `ROADMAP_URL` env; stale copy served through upstream blips)
  and re-checks every minute — merged plan changes appear without an image
  rebuild. The build-time copy remains the offline fallback.
- In-progress marker: `- [~]` checkbox items render as "In progress" with an
  accent badge, so the panel shows what is being worked on right now.

## [1.1.0] - 2026-07-24

### Changed
- Mission control's roadmap board now renders the real plan: sections and
  checkbox items parsed from `docs/ROADMAP.md` at build time (Vite `?raw`
  import), with per-section progress badges. The hand-maintained M1-M5
  milestone list — already stale — is gone, along with its i18n keys. The
  board's language follows the roadmap file (English) by design: it is a
  rendering of the repo document, not translated copy.

## [1.0.0] - 2026-07-21

First tagged release. A React 19 console over the four-service platform, served
through a Hono BFF behind a single origin.

### Added
- Six sections: Research (live SSE agent trace), Models (catalog + ping), Usage,
  Knowledge, Telemetry and Mission-control.
- A Hono BFF that injects platform keys server-side, proxies SSE untouched, and
  rate-limits `/api/*` — so the browser holds no credentials and the backends need
  no CORS.
- Generated contracts (Kubb) from committed OpenAPI snapshots: TypeScript types
  and Zod schemas, with CI failing on drift.
- Umbrella `docker-compose.yml` bringing up the whole platform — Postgres, Redis,
  four backends, BFF and Caddy — offline with mock models.
- Strict Feature-Sliced Design enforced by Steiger, CSS Modules with design
  tokens, RU/EN i18n typed so a missing key fails typecheck.
- Quality gates: jsdom axe a11y pass, Playwright e2e harness, and
  `scripts/platform_smoke.py` verifying the cross-service links.
- Ten ADRs recording the platform-wide decisions.

### Changed
- TypeScript 5.9 → 7 (the native `tsgo` compiler). Two adjustments were needed:
  `baseUrl` was removed from the language, and the native compiler no longer
  exposes the JS compiler API, so `steiger.config` had to move from `.ts` to
  `.js` (cosmiconfig loads `.ts` configs through `typescript.findConfigFile`).
- Node 26 images and `@types/node` 26; pnpm pinned to 11.15.1 via
  `packageManager`, so CI, the images and local work all resolve identically.

### Notes
- The browser e2e suite needs Docker Hub reachable and the backend repos checked
  out as siblings.

[1.0.0]: https://github.com/INTERpol21/llm-platform-console/releases/tag/v1.0.0
