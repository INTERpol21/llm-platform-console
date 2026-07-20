// Re-export the generated backend contract types — never redefined here.
export type {
  ResearchRunsPage as ResearchRunsWirePage,
  Evidence,
} from '@console/contracts/orchestrator';

import type { Evidence } from '@console/contracts/orchestrator';

/**
 * One research-run telemetry record, normalized to the fields the UI renders.
 * The wire item is an open object, so this is the tolerant, rendered shape.
 */
export interface ResearchRun {
  id: string;
  threadId: string | null;
  question: string;
  mode: string | null;
  model: string | null;
  answer: string;
  iterations: number;
  evidenceCount: number;
  totalMs: number | null;
  trace: string[];
  evidence: Evidence[];
  createdAt: string | null;
}

/** A normalized, cursor-paginated page of research-run telemetry. */
export interface ResearchRunsPage {
  items: ResearchRun[];
  nextCursor: number | null;
  enabled: boolean;
}
