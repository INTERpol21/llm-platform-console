import type {
  ResearchRun,
  ResearchRunOut,
  ResearchRunsPage,
  ResearchRunsWirePage,
} from './types.ts';

/** Project one fully-typed research-run wire row into the rendered UI shape. */
export function normalizeResearchRun(raw: ResearchRunOut): ResearchRun {
  return {
    id: String(raw.id),
    threadId: raw.thread_id,
    question: raw.question,
    mode: raw.mode,
    model: raw.model ?? null,
    answer: raw.answer,
    iterations: raw.iterations,
    evidenceCount: raw.evidence_count,
    totalMs: raw.total_ms,
    trace: raw.trace ?? [],
    evidence: raw.evidence ?? [],
    createdAt: raw.created_at,
  };
}

/**
 * Project the research-runs page into the UI shape. `next_cursor` is `null` at
 * the end of the keyset; `enabled` is false when no telemetry DB is configured.
 */
export function normalizeResearchRunsPage(raw: ResearchRunsWirePage): ResearchRunsPage {
  return {
    items: raw.items.map(normalizeResearchRun),
    nextCursor: raw.next_cursor ?? null,
    enabled: raw.enabled,
  };
}
