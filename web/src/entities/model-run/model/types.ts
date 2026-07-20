// Re-export the generated backend contract type — never redefined here.
export type { ModelRunsV1ModelRunsGet200 } from '@console/contracts/gateway';

/**
 * One model-call telemetry record, normalized to the fields the UI renders.
 * The wire item is an open object, so this is the tolerant, rendered shape.
 */
export interface ModelRun {
  id: string;
  requestId: string | null;
  provider: string;
  model: string;
  servedModel: string | null;
  status: string;
  streaming: boolean;
  cacheHit: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextWindow: number | null;
  contextUsedPct: number | null;
  costUsd: number | null;
  totalMs: number | null;
  error: string | null;
  createdAt: string | null;
}

/** A normalized, cursor-paginated page of model-call telemetry. */
export interface ModelRunsPage {
  items: ModelRun[];
  nextCursor: number | null;
  enabled: boolean;
}
