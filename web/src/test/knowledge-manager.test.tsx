import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeManager } from '../widgets/knowledge-manager/index.ts';
import { renderWithProviders } from './render.tsx';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response;
}

const emptyStats = { documents: 0, chunks: 0, sources: {} };

interface RouteOverrides {
  ingest?: () => Promise<Response>;
  query?: () => Promise<Response>;
}

/** Route the BFF calls the widget makes: /rag/stats (GET), /rag/ingest, /rag/query (POST). */
function stubRag(overrides: RouteOverrides = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (url.includes('/rag/stats')) return Promise.resolve(jsonResponse(emptyStats));
      if (url.includes('/rag/ingest') && method === 'POST') {
        return (
          overrides.ingest?.() ??
          Promise.resolve(jsonResponse({ document_ids: ['d1'], chunks_indexed: 3, skipped: 0 }))
        );
      }
      if (url.includes('/rag/query') && method === 'POST') {
        return (
          overrides.query?.() ??
          Promise.resolve(jsonResponse({ answer: '', citations: [], retrieved: [] }))
        );
      }
      return Promise.reject(new Error(`unexpected ${method} ${url}`));
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('KnowledgeManager ingest form', () => {
  it('submits a document and surfaces the success result', async () => {
    // Catches: ingest wiring broken so the server's chunk count never reaches the UI.
    stubRag();
    renderWithProviders(<KnowledgeManager />);

    await userEvent.type(screen.getByPlaceholderText('Document title'), 'RAG Primer');
    await userEvent.type(
      screen.getByPlaceholderText('Paste the document contents…'),
      'Retrieval augmented generation grounds answers in sources.',
    );
    await userEvent.click(screen.getByRole('button', { name: /^ingest$/i }));

    const banner = await screen.findByTestId('ingest-success');
    expect(banner).toHaveTextContent('Indexed 3 chunks (0 skipped).');
  });

  it('surfaces an error when ingestion fails', async () => {
    // Catches: a failed ingest silently swallowed, leaving the user with no feedback.
    stubRag({ ingest: () => Promise.resolve(jsonResponse({ detail: 'boom' }, false, 500)) });
    renderWithProviders(<KnowledgeManager />);

    await userEvent.type(screen.getByPlaceholderText('Document title'), 'Broken');
    await userEvent.type(
      screen.getByPlaceholderText('Paste the document contents…'),
      'This ingestion will fail.',
    );
    await userEvent.click(screen.getByRole('button', { name: /^ingest$/i }));

    expect(await screen.findByTestId('ingest-error')).toBeInTheDocument();
    expect(screen.queryByTestId('ingest-success')).not.toBeInTheDocument();
  });
});

describe('KnowledgeManager query box', () => {
  it('renders retrieved chunks with source badges', async () => {
    // Catches: query results (and their per-source provenance badge) not rendering.
    stubRag({
      query: () =>
        Promise.resolve(
          jsonResponse({
            answer: 'RAG grounds answers in retrieved context.',
            citations: [],
            retrieved: [
              {
                chunk_id: 'c1',
                document_id: 'd1',
                title: 'Retrieval Primer',
                ord: 0,
                score: 0.91,
                source: 'web',
              },
            ],
          }),
        ),
    });
    renderWithProviders(<KnowledgeManager />);

    await userEvent.type(screen.getByPlaceholderText('Ask the knowledge base…'), 'What is RAG?');
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    const chunk = await screen.findByTestId('chunk-item');
    expect(chunk).toHaveTextContent('Retrieval Primer');
    // The source provenance badge must be present and reflect the chunk's source.
    expect(chunk).toHaveTextContent('Web');
    expect(screen.getByTestId('query-answer')).toHaveTextContent(
      'RAG grounds answers in retrieved context.',
    );
  });
});
