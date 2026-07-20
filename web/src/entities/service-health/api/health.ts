import { useQuery } from '@tanstack/react-query';
import type { ServiceDescriptor, ServiceHealth } from '../model/types.ts';

export const healthKeys = {
  all: ['service-health'] as const,
  service: (id: string) => [...healthKeys.all, id] as const,
};

/**
 * Probe one service's liveness. Unlike apiGet this never throws: a probe is a
 * yes/no reachability check, so a non-2xx or a network error resolves to a
 * `down` result the board can render, not an exception.
 */
export async function probeService(
  service: ServiceDescriptor,
  signal?: AbortSignal,
): Promise<ServiceHealth> {
  const started = performance.now();
  try {
    const response = await fetch(service.healthUrl, {
      signal,
      headers: { Accept: 'application/json' },
    });
    const latencyMs = Math.round(performance.now() - started);
    return {
      id: service.id,
      status: response.ok ? 'up' : 'down',
      latencyMs,
      detail: `HTTP ${response.status}`,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - started);
    return {
      id: service.id,
      status: 'down',
      latencyMs,
      detail: err instanceof Error ? err.message : 'unreachable',
    };
  }
}

/**
 * Live liveness for one service: React Query polls on an interval (cleaned up on
 * unmount) so the board reflects real state without a hand-rolled setInterval.
 */
export function useServiceHealth(service: ServiceDescriptor) {
  return useQuery({
    queryKey: healthKeys.service(service.id),
    queryFn: ({ signal }) => probeService(service, signal),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}
