// Re-export the generated backend contract types — never redefined here.
export type {
  ResearchRunsPage as ResearchRunsWirePage,
  ResearchRunOut,
  Evidence,
} from '@console/contracts/orchestrator';

import type { Evidence } from '@console/contracts/orchestrator';

/**
 * One research-run telemetry record, projected to the fields the UI renders.
 * Derived from the generated `ResearchRunOut` contract — see `normalize.ts`
 * for the (fully typed) wire → UI mapping.
 */
export interface ResearchRun {
  id: string;
  threadId: string;
  question: string;
  mode: string;
  model: string | null;
  answer: string;
  iterations: number;
  evidenceCount: number;
  totalMs: number;
  trace: string[];
  evidence: Evidence[];
  createdAt: string;
}

/** A cursor-paginated page of research-run telemetry in the UI's shape. */
export interface ResearchRunsPage {
  items: ResearchRun[];
  nextCursor: number | null;
  enabled: boolean;
}
