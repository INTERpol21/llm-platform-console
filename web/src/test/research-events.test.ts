import { describe, expect, it } from 'vitest';
import { parseResearchEvent } from '../entities/research/model/events.ts';

/**
 * The orchestrator sends *unnamed* SSE frames and puts the kind inside the JSON
 * payload. The parser used to dispatch only on the SSE event name, so every
 * frame fell through to `null`: the console streamed a live run and rendered
 * nothing but "Waiting for the agent…" forever. These pin the real wire format
 * — copy the shapes from `agent-orchestrator/app/api/routes/research.py`.
 */
describe('parseResearchEvent — orchestrator wire format (unnamed frames)', () => {
  it('reads a trace frame', () => {
    const event = parseResearchEvent({
      event: 'message',
      data: JSON.stringify({ type: 'trace', node: 'plan', line: 'plan: fell back to rag_search' }),
    });
    expect(event).toEqual({ type: 'trace', step: 'plan: fell back to rag_search' });
  });

  it('reads a result frame as the final answer', () => {
    const event = parseResearchEvent({
      event: 'message',
      data: JSON.stringify({
        type: 'result',
        thread_id: 'abc123',
        answer: 'pgvector uses HNSW [1]',
        iterations: 2,
        trace: [],
        evidence: [],
      }),
    });
    expect(event).toEqual({
      type: 'answer',
      answer: 'pgvector uses HNSW [1]',
      iterations: 2,
      threadId: 'abc123',
    });
  });

  it('ignores custom progress frames rather than mis-rendering them', () => {
    const event = parseResearchEvent({
      event: 'message',
      data: JSON.stringify({ type: 'custom', data: { note: 'node-internal' } }),
    });
    expect(event).toBeNull();
  });

  it('surfaces an inline error frame', () => {
    const event = parseResearchEvent({
      event: 'message',
      data: JSON.stringify({ type: 'error', message: 'upstream exploded' }),
    });
    expect(event).toEqual({ type: 'error', message: 'upstream exploded' });
  });

  it('still accepts the named-event form', () => {
    const event = parseResearchEvent({ event: 'trace', data: JSON.stringify({ step: 'plan' }) });
    expect(event).toEqual({ type: 'trace', step: 'plan' });
  });

  it('returns null for a frame that is neither form', () => {
    expect(parseResearchEvent({ event: 'message', data: '[DONE]' })).toBeNull();
  });
});
