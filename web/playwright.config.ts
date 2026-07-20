import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end config: drives the console through the single Caddy origin of the
 * umbrella `docker compose` stack (offline, mock models). Point at another
 * origin with E2E_BASE_URL. Chromium is pre-provisioned in CI/dev via
 * PLAYWRIGHT_BROWSERS_PATH; no `playwright install` step is needed there.
 *
 * These specs need the running stack, so they are a separate job from the unit
 * gate (`pnpm -r test`) — see .github/workflows/ci.yml `e2e`.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
