import type { Evidence } from '@console/contracts/orchestrator';
import { evidenceSchema } from '@console/contracts/orchestrator';
import { z } from 'zod';
import type { SseMessage } from '../../../shared/api/index.ts';

export type { Evidence } from '@console/contracts/orchestrator';

/**
 * Domain events carried over the research SSE stream. The server frames each
 * as a named SSE event whose `data` is JSON; a bare `trace` string is also
 * tolerated for robustness.
 */
export type ResearchStreamEvent =
  | { type: 'trace'; step: string }
  | { type: 'evidence'; evidence: Evidence }
  | { type: 'token'; text: string }
  | { type: 'answer'; answer: string; iterations: number; threadId: string }
  | { type: 'error'; message: string };

const traceData = z.object({ step: z.string() });
const tokenData = z.object({ text: z.string() });
const answerData = z.object({
  answer: z.string(),
  iterations: z.number().int().nonnegative().catch(0),
  thread_id: z.string(),
});
const errorData = z.object({ message: z.string() });

/** Unnamed frame whose kind lives in the payload — the orchestrator's wire format. */
const inlineData = z.object({
  type: z.string(),
  line: z.string().optional(),
  answer: z.string().optional(),
  iterations: z.number().int().nonnegative().optional(),
  thread_id: z.string().optional(),
  message: z.string().optional(),
});

function safeJson(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/**
 * Map one raw SSE frame to a typed domain event, or `null` if it is unknown or
 * malformed. Keeping this pure makes stream ordering trivially unit-testable.
 */
export function parseResearchEvent(message: SseMessage): ResearchStreamEvent | null {
  const json = safeJson(message.data);

  // The orchestrator sends unnamed frames and carries the kind inside the JSON
  // (`{"type": "trace", "node": ..., "line": ...}`), so every frame arrives here
  // as the default "message" event. Dispatch on the payload first, and fall
  // through to the named-event form below for any producer that uses it.
  if (message.event === 'message' && json && typeof json === 'object') {
    const inline = inlineData.safeParse(json);
    if (inline.success) {
      switch (inline.data.type) {
        case 'trace':
          return { type: 'trace', step: inline.data.line ?? '' };
        case 'result':
          return {
            type: 'answer',
            answer: inline.data.answer ?? '',
            iterations: inline.data.iterations ?? 0,
            threadId: inline.data.thread_id ?? '',
          };
        case 'error':
          return { type: 'error', message: inline.data.message ?? 'stream error' };
        // "custom" frames carry node-internal progress with no UI contract yet.
        default:
          return null;
      }
    }
  }

  switch (message.event) {
    case 'trace': {
      const parsed = traceData.safeParse(typeof json === 'string' ? { step: json } : json);
      return parsed.success ? { type: 'trace', step: parsed.data.step } : null;
    }
    case 'evidence': {
      const parsed = evidenceSchema.safeParse(json);
      return parsed.success ? { type: 'evidence', evidence: parsed.data } : null;
    }
    case 'token': {
      const parsed = tokenData.safeParse(typeof json === 'string' ? { text: json } : json);
      return parsed.success ? { type: 'token', text: parsed.data.text } : null;
    }
    case 'answer':
    case 'done': {
      const parsed = answerData.safeParse(json);
      return parsed.success
        ? {
            type: 'answer',
            answer: parsed.data.answer,
            iterations: parsed.data.iterations,
            threadId: parsed.data.thread_id,
          }
        : null;
    }
    case 'error': {
      const parsed = errorData.safeParse(typeof json === 'string' ? { message: json } : json);
      return parsed.success ? { type: 'error', message: parsed.data.message } : null;
    }
    default:
      return null;
  }
}
