import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../shared/i18n/i18n.ts';
import { MissionControl } from '../widgets/mission-control/index.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MissionControl', () => {
  it('shows every service up when all health probes succeed, plus the roadmap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ status: 'ok' }))),
    );

    renderWithClient(<MissionControl />);

    // One card per platform service (gateway, rag, orchestrator, bff).
    const cards = await screen.findAllByTestId('service-health-card');
    expect(cards).toHaveLength(4);

    await waitFor(() => {
      const statuses = screen.getAllByTestId('service-status');
      expect(statuses).toHaveLength(4);
      for (const badge of statuses) expect(badge).toHaveTextContent(/up|в строю/i);
    });

    // The roadmap board renders all five milestones.
    expect(screen.getByTestId('roadmap').querySelectorAll('li')).toHaveLength(5);
  });

  it('marks a service down when its probe fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/orchestrator/')) return Promise.reject(new Error('refused'));
        return Promise.resolve(jsonResponse({ status: 'ok' }));
      }),
    );

    renderWithClient(<MissionControl />);

    await waitFor(() => {
      const down = screen
        .getAllByTestId('service-status')
        .filter((b) => /down|недоступен/i.test(b.textContent ?? ''));
      expect(down).toHaveLength(1);
    });
  });
});
