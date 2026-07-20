// Re-export the generated backend contract type — never redefined here.
export type { UsageReportV1UsageGet200 } from '@console/contracts/gateway';

/** One model's slice of the usage report, normalized to the fields the UI shows. */
export interface UsageModelRow {
  model: string;
  requests: number;
  tokens: number;
  cost_usd: number;
}

/**
 * Flat, chart-ready view of the gateway usage report. The wire schema is an
 * open object (`additionalProperties: true`), so this is the normalized shape
 * the widgets actually render.
 */
export interface UsageSummary {
  window: string | null;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  models: UsageModelRow[];
}
