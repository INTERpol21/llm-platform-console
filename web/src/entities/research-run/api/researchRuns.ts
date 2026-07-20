import { researchRunsV1ResearchRunsGet200Schema } from '@console/contracts/orchestrator';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '../../../shared/api/index.ts';
import { ORCHESTRATOR_BASE } from '../../../shared/config/index.ts';
import { normalizeResearchRunsPage } from '../model/normalize.ts';
import type { ResearchRun, ResearchRunsPage } from '../model/types.ts';

export const researchRunKeys = {
  all: ['research-runs'] as const,
  list: (limit: number) => [...researchRunKeys.all, 'list', limit] as const,
};

export interface FetchResearchRunsParams {
  limit: number;
  cursor?: number | null;
  signal?: AbortSignal;
}

/** Fetch + runtime-validate + normalize one page of research-run telemetry. */
export async function fetchResearchRuns({
  limit,
  cursor,
  signal,
}: FetchResearchRunsParams): Promise<ResearchRunsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined && cursor !== null) params.set('cursor', String(cursor));
  const raw = await apiGet<unknown>(`${ORCHESTRATOR_BASE}/research/runs?${params.toString()}`, {
    signal,
  });
  return normalizeResearchRunsPage(researchRunsV1ResearchRunsGet200Schema.parse(raw));
}

export interface ResearchRunsView {
  items: ResearchRun[];
  enabled: boolean;
}

/**
 * Cursor-paginated research-run telemetry. Flattens the loaded pages and
 * surfaces the `enabled` flag (false when no telemetry DB is configured) from
 * the first page, so the widget can show a disabled empty state, not an error.
 */
export function useResearchRuns(limit = 20) {
  return useInfiniteQuery<
    ResearchRunsPage,
    Error,
    ResearchRunsView,
    ReturnType<typeof researchRunKeys.list>,
    number | null
  >({
    queryKey: researchRunKeys.list(limit),
    queryFn: ({ pageParam, signal }) => fetchResearchRuns({ limit, cursor: pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      items: data.pages.flatMap((page) => page.items),
      enabled: data.pages[0]?.enabled ?? true,
    }),
    staleTime: 30_000,
  });
}
