import { fetchEventSource } from '@microsoft/fetch-event-source';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchConsole } from '../widgets/research-console/index.ts';
import { renderWithProviders } from './render.tsx';

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

const mockFes = vi.mocked(fetchEventSource);

type FesOptions = Parameters<typeof fetchEventSource>[1];

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  mockFes.mockReset();
  // Catalog request for the inline model selector — empty is fine.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(jsonResponse([]))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function submitQuestion() {
  await userEvent.type(
    screen.getByPlaceholderText('What would you like to research?'),
    'What is retrieval augmented generation?',
  );
  await userEvent.click(screen.getByRole('button', { name: /run research/i }));
}

describe('ResearchConsole', () => {
  it('renders the trace, then the answer with clickable citations', async () => {
    // Catches: broken stream wiring where trace/answer/evidence never reach the DOM.
    mockFes.mockImplementation(async (_url, options) => {
      const opts = options as FesOptions;
      await opts.onopen?.({ ok: true, status: 200, headers: new Headers() } as Response);
      opts.onmessage?.({
        id: '',
        event: 'trace',
        data: JSON.stringify({ step: 'Searching sources' }),
      });
      opts.onmessage?.({
        id: '',
        event: 'evidence',
        data: JSON.stringify({
          source: 'rag',
          ref: 'RAG Primer',
          content: 'Grounding text',
          score: 0.91,
        }),
      });
      opts.onmessage?.({
        id: '',
        event: 'answer',
        data: JSON.stringify({
          answer: 'RAG grounds answers in sources [1].',
          iterations: 2,
          thread_id: 't-1',
        }),
      });
      opts.onclose?.();
    });

    renderWithProviders(<ResearchConsole />);
    await submitQuestion();

    expect(await screen.findByText('Searching sources')).toBeInTheDocument();

    const answer = await screen.findByTestId('answer');
    expect(answer).toHaveTextContent('RAG grounds answers in sources');

    const citation = screen.getByTestId('citation');
    expect(citation).toHaveTextContent('[1]');
    expect(citation).toBeEnabled();
    expect(screen.getByTestId('evidence-item')).toHaveTextContent('RAG Primer');

    // Clicking a valid citation must not throw.
    await userEvent.click(citation);
  });

  it('shows an error and keeps the trace when the stream fails mid-run', async () => {
    // Catches: an unhandled stream error tearing down the component.
    mockFes.mockImplementation(async (_url, options) => {
      const opts = options as FesOptions;
      await opts.onopen?.({ ok: true, status: 200, headers: new Headers() } as Response);
      opts.onmessage?.({
        id: '',
        event: 'trace',
        data: JSON.stringify({ step: 'Started planning' }),
      });
      throw new Error('network blip');
    });

    renderWithProviders(<ResearchConsole />);
    await submitQuestion();

    expect(await screen.findByRole('alert')).toHaveTextContent('The stream was interrupted.');
    // The partial trace survived the failure — the component did not crash.
    expect(screen.getByText('Started planning')).toBeInTheDocument();
  });
});
