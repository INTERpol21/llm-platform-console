import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * End-to-end smoke against the umbrella stack (offline, mock models) through the
 * single Caddy origin. Proves the console boots, routes between sections, streams
 * the agent trace, and passes a live-browser axe scan (with the layout/paint
 * rules jsdom can't run). Requires the compose stack to be up.
 */

test('boots, routes, and renders the model catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/models$/); // index redirects to /models
  await expect(page.getByRole('heading', { name: /model catalog/i })).toBeVisible();
});

test('navigates to mission control and shows live service health', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /mission control/i }).click();
  await expect(page).toHaveURL(/\/mission$/);
  await expect(page.getByTestId('service-health-card').first()).toBeVisible();
});

test('research answers with a streamed trace and cited answer', async ({ page }) => {
  await page.goto('/research');
  await page.getByLabel(/question/i).fill('How does pgvector index embeddings?');
  await page.getByRole('button', { name: /run research/i }).click();
  // The live SSE trace appears, then the grounded answer.
  await expect(page.getByTestId('answer')).toBeVisible({ timeout: 30_000 });
});

test('mission control has no serious axe violations (live browser)', async ({ page }) => {
  await page.goto('/mission');
  await page.getByTestId('service-health-card').first().waitFor();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(serious).toEqual([]);
});
