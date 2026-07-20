import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelCatalog } from '../widgets/model-catalog/index.ts';
import { renderWithProviders } from './render.tsx';

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

const pingResult = {
  id: 'gpt-4o',
  provider: 'openai',
  configured: true,
  reachable: true,
  status: 'ok',
  latency_ms: 12,
  checked_at: 1_700_000_000,
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/ping')) return Promise.resolve(jsonResponse(pingResult));
      if (url.includes('/models/catalog')) return Promise.resolve(jsonResponse([catalogEntry]));
      return Promise.reject(new Error(`unexpected url ${url}`));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ModelCatalog', () => {
  it('renders a card with model status and latency from the catalog', async () => {
    // Catches: catalog fields not wired through, or latency formatter regressions.
    renderWithProviders(<ModelCatalog />);

    expect(await screen.findByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(screen.getByText('840 ms')).toBeInTheDocument();
  });

  it('updates the card when the ping action resolves', async () => {
    // Catches: ping result not flowing back into the card (status/latency stale).
    renderWithProviders(<ModelCatalog />);
    await screen.findByText('gpt-4o');

    expect(screen.queryByTestId('ping-status')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ping/i }));

    expect(await screen.findByTestId('ping-status')).toHaveTextContent('Reachable');
    // Ping latency (12 ms) overrides the catalog latency (840 ms).
    await waitFor(() => expect(screen.getByText('12 ms')).toBeInTheDocument());
  });
});
