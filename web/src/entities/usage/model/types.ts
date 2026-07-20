// Re-export the generated backend contract types — never redefined here.
export type {
  UsageReportV1UsageGet200,
  UsageReport,
  UsageModelRow as UsageModelRowWire,
} from '@console/contracts/gateway';

/** One model's slice of the usage report, projected to the fields the UI shows. */
export interface UsageModelRow {
  model: string;
  requests: number;
  tokens: number;
  cost_usd: number;
}

/**
 * Flat, chart-ready view of the gateway usage report. Derived from the
 * generated `UsageReport` contract — see `normalize.ts` for the (fully typed)
 * report → summary mapping.
 */
export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  models: UsageModelRow[];
}
