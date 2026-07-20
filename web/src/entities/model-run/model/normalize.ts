import type { ModelRunsV1ModelRunsGet200 } from '@console/contracts/gateway';
import type { ModelRun, ModelRunsPage } from './types.ts';

/** Coerce an unknown wire value to a finite number, or `null` when absent. */
function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Coerce an unknown wire value to a finite number, defaulting to 0. */
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

/** Total tokens from an explicit field, or derived from the prompt/completion split. */
function totalTokensOf(raw: Record<string, unknown>): number {
  if (raw.total_tokens !== undefined) return num(raw.total_tokens);
  return num(raw.prompt_tokens) + num(raw.completion_tokens);
}

/** Fold one open-object model-run wire item into the rendered shape. */
export function normalizeModelRun(raw: Record<string, unknown>, index: number): ModelRun {
  const id = str(raw.id) || str(raw.request_id) || `run-${index}`;
  return {
    id,
    requestId: strOrNull(raw.request_id),
    provider: str(raw.provider) || 'unknown',
    model: str(raw.model) || 'unknown',
    servedModel: strOrNull(raw.served_model),
    status: str(raw.status) || 'unknown',
    streaming: bool(raw.streaming),
    cacheHit: bool(raw.cache_hit),
    promptTokens: num(raw.prompt_tokens),
    completionTokens: num(raw.completion_tokens),
    totalTokens: totalTokensOf(raw),
    contextWindow: numOrNull(raw.context_window),
    contextUsedPct: numOrNull(raw.context_used_pct),
    costUsd: numOrNull(raw.cost_usd),
    totalMs: numOrNull(raw.total_ms),
    error: strOrNull(raw.error),
    createdAt: strOrNull(raw.created_at),
  };
}

/**
 * Normalize the open gateway model-runs page. Tolerant by design: `items` may
 * be missing, `enabled` defaults to `true` unless the server says otherwise,
 * and `next_cursor` is `null` at the end of the keyset.
 */
export function normalizeModelRunsPage(raw: ModelRunsV1ModelRunsGet200): ModelRunsPage {
  const page = raw as Record<string, unknown>;
  const rawItems = Array.isArray(page.items) ? page.items : [];
  const items: ModelRun[] = [];
  for (const [index, item] of rawItems.entries()) {
    if (item && typeof item === 'object') {
      items.push(normalizeModelRun(item as Record<string, unknown>, index));
    }
  }
  return {
    items,
    nextCursor: numOrNull(page.next_cursor),
    enabled: page.enabled !== false,
  };
}
