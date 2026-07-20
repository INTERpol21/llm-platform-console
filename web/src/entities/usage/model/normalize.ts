import type { UsageModelRow, UsageReport, UsageSummary } from './types.ts';

/**
 * Fold the gateway usage report into a flat, chart-ready summary. The report
 * carries its own aggregate totals (top-level `requests`/tokens/`cost_usd`) and
 * a per-model breakdown keyed by model name; every field is optional on the
 * wire and defaults to 0.
 */
export function normalizeUsage(raw: UsageReport): UsageSummary {
  const models: UsageModelRow[] = Object.entries(raw.models ?? {}).map(([model, row]) => ({
    model,
    requests: row.requests ?? 0,
    tokens: (row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0),
    cost_usd: row.cost_usd ?? 0,
  }));

  return {
    totalRequests: raw.requests ?? 0,
    totalTokens: (raw.prompt_tokens ?? 0) + (raw.completion_tokens ?? 0),
    totalCostUsd: raw.cost_usd ?? 0,
    models,
  };
}
