import type { ResearchHistoryResponse } from '@console/contracts/orchestrator';
import { researchHistoryResearchHistoryThreadIdGet200Schema } from '@console/contracts/orchestrator';
import { apiGet, streamSse } from '../../../shared/api/index.ts';
import { ORCHESTRATOR_BASE } from '../../../shared/config/index.ts';
import type { ResearchStreamEvent } from '../model/events.ts';
import { parseResearchEvent } from '../model/events.ts';

export interface StreamResearchOptions {
  question: string;
  maxIterations?: number;
  threadId?: string | null;
  signal?: AbortSignal;
  onOpen?: () => void;
  onEvent: (event: ResearchStreamEvent) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
}

/** Open the research SSE stream and deliver typed, ordered domain events. */
export function streamResearch(options: StreamResearchOptions): Promise<void> {
  const { question, maxIterations, threadId, signal, onOpen, onEvent, onError, onClose } = options;

  return streamSse({
    url: `${ORCHESTRATOR_BASE}/research/stream`,
    method: 'POST',
    body: {
      question,
      ...(maxIterations !== undefined ? { max_iterations: maxIterations } : {}),
      ...(threadId ? { thread_id: threadId } : {}),
    },
    signal,
    onOpen,
    onMessage: (message) => {
      const event = parseResearchEvent(message);
      if (event) onEvent(event);
    },
    onError,
    onClose,
  });
}

/** Load the latest checkpointed snapshot for a thread. */
export async function fetchResearchHistory(
  threadId: string,
  signal?: AbortSignal,
): Promise<ResearchHistoryResponse> {
  const raw = await apiGet<unknown>(
    `${ORCHESTRATOR_BASE}/research/history/${encodeURIComponent(threadId)}`,
    { signal },
  );
  return researchHistoryResearchHistoryThreadIdGet200Schema.parse(raw);
}
