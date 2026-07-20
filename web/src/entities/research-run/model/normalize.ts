import type { Evidence, ResearchRunsWirePage } from './types.ts';
import type { ResearchRun, ResearchRunsPage } from './types.ts';

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Keep only the string entries of a wire array — the trace is a list of step strings. */
function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

/** Fold one open-object evidence item into the contract `Evidence` shape. */
function normalizeEvidence(value: unknown): Evidence | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const source = raw.source === 'web' ? 'web' : 'rag';
  return {
    source,
    ref: str(raw.ref),
    content: str(raw.content),
    score: numOrNull(raw.score),
  };
}

function evidenceList(value: unknown): Evidence[] {
  if (!Array.isArray(value)) return [];
  const items: Evidence[] = [];
  for (const entry of value) {
    const normalized = normalizeEvidence(entry);
    if (normalized) items.push(normalized);
  }
  return items;
}

/** Fold one open-object research-run wire item into the rendered shape. */
export function normalizeResearchRun(raw: Record<string, unknown>, index: number): ResearchRun {
  const evidence = evidenceList(raw.evidence);
  const id = str(raw.id) || str(raw.thread_id) || `run-${index}`;
  return {
    id,
    threadId: strOrNull(raw.thread_id),
    question: str(raw.question),
    mode: strOrNull(raw.mode),
    model: strOrNull(raw.model),
    answer: str(raw.answer),
    iterations: num(raw.iterations),
    evidenceCount: raw.evidence_count !== undefined ? num(raw.evidence_count) : evidence.length,
    totalMs: numOrNull(raw.total_ms),
    trace: stringList(raw.trace),
    evidence,
    createdAt: strOrNull(raw.created_at),
  };
}

/**
 * Normalize the research-runs page. Tolerant by design: `items` may be missing,
 * `enabled` defaults to `true` unless the server says otherwise, and
 * `next_cursor` is `null` at the end of the keyset.
 */
export function normalizeResearchRunsPage(raw: ResearchRunsWirePage): ResearchRunsPage {
  const page = raw as Record<string, unknown>;
  const rawItems = Array.isArray(page.items) ? page.items : [];
  const items: ResearchRun[] = [];
  for (const [index, item] of rawItems.entries()) {
    if (item && typeof item === 'object') {
      items.push(normalizeResearchRun(item as Record<string, unknown>, index));
    }
  }
  return {
    items,
    nextCursor: numOrNull(page.next_cursor),
    enabled: page.enabled !== false,
  };
}
