import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelemetryExplorer } from '../widgets/telemetry-explorer/index.ts';
import { renderWithProviders } from './render.tsx';

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response;
}

// Model-call telemetry, split across two keyset pages so the "Load more" path
// is exercised: page 1 hands back next_cursor=10, page 2 ends the keyset.
const modelPage1 = {
  enabled: true,
  next_cursor: 10,
  items: [
    {
      id: 1,
      request_id: 'req-1',
      provider: 'openai',
      model: 'gpt-4o',
      served_model: 'gpt-4o-2024',
      status: 'ok',
      streaming: false,
      cache_hit: true,
      prompt_tokens: 600,
      completion_tokens: 300,
      total_tokens: 900,
      context_window: 128000,
      context_used_pct: 45,
      cost_usd: 0.12,
      total_ms: 1200,
      error: null,
      created_at: '2026-07-20T10:00:00Z',
    },
  ],
};

const modelPage2 = {
  enabled: true,
  next_cursor: null,
  items: [
    {
      id: 2,
      provider: 'anthropic',
      model: 'claude-3-sonnet',
      served_model: 'claude-3-sonnet-2024',
      status: 'ok',
      streaming: true,
      cache_hit: false,
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
      cost_usd: 0.02,
      total_ms: 800,
      created_at: '2026-07-20T09:30:00Z',
    },
  ],
};

const researchPage = {
  enabled: true,
  next_cursor: null,
  items: [
    {
      id: 1,
      thread_id: 't1',
      question: 'What is Feature-Sliced Design?',
      mode: 'deep',
      model: 'gpt-4o',
      answer: 'Feature-Sliced Design is an architecture.\n\nIt organizes code into layers.',
      iterations: 3,
      evidence_count: 2,
      total_ms: 5000,
      trace: ['plan', 'execute', 'reflect', 'synthesize'],
      evidence: [
        { source: 'rag', ref: 'handbook.md', content: 'Layers and slices.', score: 0.91 },
        {
          source: 'web',
          ref: 'https://feature-sliced.design',
          content: 'Official site.',
          score: 0.8,
        },
      ],
      created_at: '2026-07-20T09:00:00Z',
    },
  ],
};

/** Route the stubbed fetch by URL (and cursor) and expose the mock for assertions. */
function stubTelemetry(overrides?: { modelPage1?: unknown; disabled?: boolean }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/model-runs')) {
      if (overrides?.disabled) {
        return jsonResponse({ enabled: false, next_cursor: null, items: [] });
      }
      return jsonResponse(
        url.includes('cursor=') ? modelPage2 : (overrides?.modelPage1 ?? modelPage1),
      );
    }
    if (url.includes('/research/runs')) {
      return jsonResponse(researchPage);
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TelemetryExplorer', () => {
  it('renders model-run rows with stats and paginates via next_cursor', async () => {
    // Catches: the model-calls list never rendering its normalized stats, or
    // "Load more" not threading next_cursor into the follow-up request (so the
    // second keyset page is silently dropped).
    const fetchMock = stubTelemetry();
    const user = userEvent.setup();
    renderWithProviders(<TelemetryExplorer />);

    // First page: the row and its headline stats are on screen.
    const firstRow = await screen.findByTestId('model-run-row');
    expect(firstRow).toHaveTextContent('gpt-4o');
    expect(firstRow).toHaveTextContent('900'); // total tokens, app formatter
    expect(firstRow).toHaveTextContent('45%'); // context used
    expect(firstRow).toHaveTextContent('$0.12'); // cost

    // Second page is not present until we ask for it.
    expect(screen.queryByText('claude-3-sonnet')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('load-more'));

    // The second keyset page rendered, proving next_cursor was used…
    expect(await screen.findByText('claude-3-sonnet')).toBeInTheDocument();
    // …and the follow-up request actually carried the cursor.
    const cursoredCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).includes('/model-runs') && String(call[0]).includes('cursor=10'),
    );
    expect(cursoredCall).toBeDefined();
  });

  it('renders a research-run detail with trace timeline, evidence badges, and answer', async () => {
    // Catches: the "what was fed → steps → result" detail view failing to
    // render the plan→…→synthesize trace, the source-badged evidence, or the
    // answer text for the selected research run.
    stubTelemetry();
    const user = userEvent.setup();
    renderWithProviders(<TelemetryExplorer />);

    await user.click(screen.getByRole('tab', { name: 'Research runs' }));

    const detail = await screen.findByTestId('research-run-detail');

    // Trace timeline: all four plan→execute→reflect→synthesize steps.
    const timeline = within(detail).getByTestId('trace-timeline');
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(4);
    expect(timeline).toHaveTextContent('plan');
    expect(timeline).toHaveTextContent('synthesize');

    // Evidence with source badges (knowledge base + web).
    const badges = within(detail).getAllByTestId('source-badge');
    expect(badges).toHaveLength(2);
    expect(within(detail).getByText('handbook.md')).toBeInTheDocument();
    expect(badges.map((b) => b.textContent)).toEqual(
      expect.arrayContaining(['Knowledge base', 'Web']),
    );

    // The answer text.
    expect(within(detail).getByTestId('research-run-answer')).toHaveTextContent(
      'Feature-Sliced Design is an architecture.',
    );
  });

  it('shows the disabled state (not an error) when telemetry is disabled', async () => {
    // Catches: treating enabled:false as a failure — the UI must show a clear
    // "telemetry disabled" message, never the generic error/retry state.
    stubTelemetry({ disabled: true });
    renderWithProviders(<TelemetryExplorer />);

    expect(await screen.findByTestId('telemetry-disabled')).toBeInTheDocument();
    expect(screen.queryByTestId('telemetry-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('telemetry-empty')).not.toBeInTheDocument();
  });
});
