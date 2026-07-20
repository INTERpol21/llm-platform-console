// Re-export the generated backend contract types — never redefined here.
export type {
  ModelRunsV1ModelRunsGet200,
  ModelRunOut,
  ModelRunsPage as ModelRunsWirePage,
} from '@console/contracts/gateway';

/**
 * One model-call telemetry record, projected to the camelCase fields the UI
 * renders. Derived from the generated `ModelRunOut` contract — see
 * `normalize.ts` for the (fully typed) wire → UI mapping.
 */
export interface ModelRun {
  id: string;
  requestId: string | null;
  provider: string;
  model: string;
  servedModel: string;
  status: string;
  streaming: boolean;
  cacheHit: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  contextWindow: number | null;
  contextUsedPct: number | null;
  costUsd: number;
  totalMs: number;
  error: string | null;
  createdAt: string;
}

/** A cursor-paginated page of model-call telemetry in the UI's shape. */
export interface ModelRunsPage {
  items: ModelRun[];
  nextCursor: number | null;
  enabled: boolean;
}
