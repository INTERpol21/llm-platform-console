import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { cloneElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UsageDashboard } from '../widgets/usage-dashboard/index.ts';
import { renderWithProviders } from './render.tsx';

// Recharts' ResponsiveContainer measures its parent, which is 0x0 in jsdom and
// would render an empty chart. Give the chart a concrete size so an <svg> is
// actually produced and the "chart renders" assertion is meaningful.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
        width: 640,
        height: 280,
      }),
  };
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response;
}

// Requests kept < 1000 so toLocaleString has no locale-dependent separators.
// Shape matches the named `UsageReport` contract: top-level aggregate totals
// plus a per-model breakdown keyed by model name.
const usageReport = {
  object: 'usage',
  api_key: 'sk-test',
  requests: 63,
  prompt_tokens: 800_000,
  completion_tokens: 400_000,
  cost_usd: 12.5,
  models: {
    'gpt-4o': { requests: 42, prompt_tokens: 500_000, completion_tokens: 300_000, cost_usd: 9.0 },
    'claude-3': { requests: 21, prompt_tokens: 300_000, completion_tokens: 100_000, cost_usd: 3.5 },
  },
};

function stubUsage(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(jsonResponse(body))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UsageDashboard', () => {
  beforeEach(() => {
    stubUsage(usageReport);
  });

  it('renders stat tiles and a chart from the mocked usage report', async () => {
    // Catches: totals not aggregated/normalized, or the chart never mounting —
    // i.e. the whole usage surface silently rendering blank.
    renderWithProviders(<UsageDashboard />);

    // Stat tiles: derived totals with the app's own deterministic formatters.
    expect(await screen.findByText('63')).toBeInTheDocument();
    expect(screen.getByText('1.2M')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();

    // Per-model breakdown proves each model row was wired through (the model
    // names also appear as chart axis ticks, so scope to the breakdown rows).
    const rows = screen.getAllByTestId('usage-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('gpt-4o');
    expect(rows[1]).toHaveTextContent('claude-3');

    // The chart itself rendered an SVG surface.
    const chart = screen.getByTestId('usage-chart');
    expect(chart.querySelector('svg')).not.toBeNull();
  });

  it('shows an empty state when there is zero usage', async () => {
    // Catches: a division-by-zero / empty-data crash instead of a graceful
    // "no usage yet" message when the report has no per-model rows.
    stubUsage({ api_key: 'sk-test', requests: 0, cost_usd: 0, models: {} });

    renderWithProviders(<UsageDashboard />);

    expect(await screen.findByTestId('usage-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('usage-chart')).not.toBeInTheDocument();
  });
});
