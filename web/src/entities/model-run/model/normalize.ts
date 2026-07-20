import type { ModelRun, ModelRunOut, ModelRunsPage, ModelRunsWirePage } from './types.ts';

/** Project one fully-typed model-run wire row into the rendered UI shape. */
export function normalizeModelRun(raw: ModelRunOut): ModelRun {
  return {
    id: String(raw.id),
    requestId: raw.request_id ?? null,
    provider: raw.provider,
    model: raw.model,
    servedModel: raw.served_model,
    status: raw.status,
    streaming: raw.streaming,
    cacheHit: raw.cache_hit,
    promptTokens: raw.prompt_tokens,
    completionTokens: raw.completion_tokens,
    totalTokens: raw.total_tokens,
    contextWindow: raw.context_window ?? null,
    contextUsedPct: raw.context_used_pct ?? null,
    costUsd: raw.cost_usd,
    totalMs: raw.total_ms,
    error: raw.error ?? null,
    createdAt: raw.created_at,
  };
}

/**
 * Project the gateway model-runs page into the UI shape. `items` is optional on
 * the wire (absent when telemetry is disabled) and `next_cursor` is `null` at
 * the end of the keyset.
 */
export function normalizeModelRunsPage(raw: ModelRunsWirePage): ModelRunsPage {
  return {
    items: (raw.items ?? []).map(normalizeModelRun),
    nextCursor: raw.next_cursor ?? null,
    enabled: raw.enabled,
  };
}
