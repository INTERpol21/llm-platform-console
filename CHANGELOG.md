# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
