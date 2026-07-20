import type { UsageReportV1UsageGet200 } from '@console/contracts/gateway';
import { usageReportV1UsageGet200Schema } from '@console/contracts/gateway';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../shared/api/index.ts';
import { GATEWAY_BASE } from '../../../shared/config/index.ts';
import { normalizeUsage } from '../model/normalize.ts';
import type { UsageSummary } from '../model/types.ts';

export const usageKeys = {
  all: ['usage'] as const,
  report: () => [...usageKeys.all, 'report'] as const,
};

/** Fetch + runtime-validate the gateway usage report. */
export async function fetchUsage(signal?: AbortSignal): Promise<UsageReportV1UsageGet200> {
  const raw = await apiGet<unknown>(`${GATEWAY_BASE}/usage`, { signal });
  return usageReportV1UsageGet200Schema.parse(raw);
}

/** React Query hook returning the normalized, chart-ready usage summary. */
export function useUsage() {
  return useQuery<UsageReportV1UsageGet200, Error, UsageSummary>({
    queryKey: usageKeys.report(),
    queryFn: ({ signal }) => fetchUsage(signal),
    select: normalizeUsage,
    staleTime: 30_000,
  });
}
