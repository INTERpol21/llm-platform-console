/**
 * Accessibility gate: axe-core run directly in jsdom (no matcher wrapper, so no
 * dependency on vitest-axe's type augmentation). Renders representative surfaces
 * the way users see them and asserts zero violations on the DOM-inspectable
 * rules (roles, names, labels, list/landmark structure). color-contrast is
 * disabled — jsdom has no layout to measure it; that check lives in the
 * Playwright + axe pass against the running stack.
 */

import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MissionControl } from '../widgets/mission-control/index.ts';
import { ModelCatalog } from '../widgets/model-catalog/index.ts';
import { renderWithProviders } from './render.tsx';

const AXE_OPTS: axe.RunOptions = { rules: { 'color-contrast': { enabled: false } } };

/** Run axe and return a compact list of "rule: node" strings for a readable diff. */
async function violations(container: Element): Promise<string[]> {
  const results = await axe.run(container, AXE_OPTS);
  return results.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response;
}

const catalogEntry = {
  id: 'gpt-4o',
  provider: 'openai',
  status: 'ok',
  latency_ms: 840,
  pricing: { input_per_1k: 0.005, output_per_1k: 0.015 },
  context_window: 128000,
  fallbacks: [],
  streaming: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('accessibility', () => {
  it('model catalog has no axe violations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/models/catalog')) return Promise.resolve(jsonResponse([catalogEntry]));
        return Promise.reject(new Error(`unexpected url ${url}`));
      }),
    );
    const { container, findByText } = renderWithProviders(<ModelCatalog />);
    await findByText('gpt-4o'); // wait for the card before scanning
    expect(await violations(container)).toEqual([]);
  });

  it('mission control board has no axe violations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ status: 'ok' }))),
    );
    const { container, findAllByTestId } = renderWithProviders(<MissionControl />);
    await findAllByTestId('service-health-card');
    expect(await violations(container)).toEqual([]);
  });
});
