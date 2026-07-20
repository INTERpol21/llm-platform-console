import type { ModelRunsV1ModelRunsGet200 } from '@console/contracts/gateway';
import { modelRunsV1ModelRunsGet200Schema } from '@console/contracts/gateway';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '../../../shared/api/index.ts';
import { GATEWAY_BASE } from '../../../shared/config/index.ts';
import { normalizeModelRunsPage } from '../model/normalize.ts';
import type { ModelRun, ModelRunsPage } from '../model/types.ts';

export const modelRunKeys = {
  all: ['model-runs'] as const,
  list: (limit: number) => [...modelRunKeys.all, 'list', limit] as const,
};

export interface FetchModelRunsParams {
  limit: number;
  cursor?: number | null;
  signal?: AbortSignal;
}

/** Fetch + runtime-validate + normalize one page of model-call telemetry. */
export async function fetchModelRuns({
  limit,
  cursor,
  signal,
}: FetchModelRunsParams): Promise<ModelRunsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== undefined && cursor !== null) params.set('cursor', String(cursor));
  const raw = await apiGet<unknown>(`${GATEWAY_BASE}/model-runs?${params.toString()}`, { signal });
  return normalizeModelRunsPage(modelRunsV1ModelRunsGet200Schema.parse(raw));
}

export interface ModelRunsView {
  items: ModelRun[];
  enabled: boolean;
}

/**
 * Cursor-paginated model-call telemetry. Flattens the loaded pages and surfaces
 * the `enabled` flag (false when no telemetry DB is configured) from the first
 * page, so the widget can show a disabled empty state instead of an error.
 */
export function useModelRuns(limit = 20) {
  return useInfiniteQuery<
    ModelRunsPage,
    Error,
    ModelRunsView,
    ReturnType<typeof modelRunKeys.list>,
    number | null
  >({
    queryKey: modelRunKeys.list(limit),
    queryFn: ({ pageParam, signal }) => fetchModelRuns({ limit, cursor: pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      items: data.pages.flatMap((page) => page.items),
      enabled: data.pages[0]?.enabled ?? true,
    }),
    staleTime: 30_000,
  });
}
