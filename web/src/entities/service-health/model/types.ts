import { API_BASE } from '../../../shared/config/index.ts';

/** The services whose liveness the Mission-control board watches. */
export type ServiceId = 'gateway' | 'rag' | 'orchestrator' | 'bff';

export type HealthStatus = 'up' | 'down';

export interface ServiceHealth {
  id: ServiceId;
  status: HealthStatus;
  /** Round-trip latency of the health probe, ms. */
  latencyMs: number;
  /** Short human detail (HTTP status or error reason). */
  detail: string;
}

export interface ServiceDescriptor {
  id: ServiceId;
  /** Unversioned liveness endpoint behind the single BFF origin. */
  healthUrl: string;
}

/**
 * Health probes hit the unversioned `/healthz` of each backend through the BFF,
 * plus the BFF's own `/api/health`. Liveness is deliberately unversioned, so
 * these paths carry no `/v1`.
 */
export const SERVICES: readonly ServiceDescriptor[] = [
  { id: 'gateway', healthUrl: `${API_BASE}/gateway/healthz` },
  { id: 'rag', healthUrl: `${API_BASE}/rag/healthz` },
  { id: 'orchestrator', healthUrl: `${API_BASE}/orchestrator/healthz` },
  { id: 'bff', healthUrl: `${API_BASE}/health` },
];
