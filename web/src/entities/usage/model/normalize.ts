import type { UsageReportV1UsageGet200 } from '@console/contracts/gateway';
import type { UsageModelRow, UsageSummary } from './types.ts';

/** Coerce an unknown wire value to a finite number, defaulting to 0. */
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Token count from either an explicit `tokens` field or input/output split. */
function tokensOf(row: Record<string, unknown>): number {
  if (row.tokens !== undefined) return num(row.tokens);
  return num(row.input_tokens) + num(row.output_tokens);
}

function rowFrom(model: string, raw: Record<string, unknown>): UsageModelRow {
  return {
    model,
    requests: num(raw.requests),
    tokens: tokensOf(raw),
    cost_usd: num(raw.cost_usd ?? raw.cost),
  };
}

/**
 * Fold the open-ended gateway usage report into a flat, chart-ready summary.
 *
 * Tolerant by design: the per-model breakdown may arrive as an array of rows
 * or as a `{ model: row }` map, totals may be pre-aggregated or absent (then
 * derived from the rows), and token counts may be split into input/output.
 */
export function normalizeUsage(raw: UsageReportV1UsageGet200): UsageSummary {
  const report = raw as Record<string, unknown>;
  const rawModels = report.by_model ?? report.per_model ?? report.models;
  const models: UsageModelRow[] = [];

  if (Array.isArray(rawModels)) {
    for (const item of rawModels) {
      if (item && typeof item === 'object') {
        const r = item as Record<string, unknown>;
        const name =
          typeof r.model === 'string' ? r.model : typeof r.id === 'string' ? r.id : 'unknown';
        models.push(rowFrom(name, r));
      }
    }
  } else if (rawModels && typeof rawModels === 'object') {
    for (const [name, item] of Object.entries(rawModels as Record<string, unknown>)) {
      if (item && typeof item === 'object') {
        models.push(rowFrom(name, item as Record<string, unknown>));
      }
    }
  }

  const totals = (report.totals ?? report.total) as Record<string, unknown> | undefined;
  const sum = (pick: (row: UsageModelRow) => number) => models.reduce((acc, m) => acc + pick(m), 0);

  return {
    window: typeof report.window === 'string' ? report.window : null,
    totalRequests: totals ? num(totals.requests) : sum((m) => m.requests),
    totalTokens: totals ? tokensOf(totals) : sum((m) => m.tokens),
    totalCostUsd: totals ? num(totals.cost_usd ?? totals.cost) : sum((m) => m.cost_usd),
    models,
  };
}
