import type {
  ModelPingV1ModelsModelIdPingGet200,
  ModelsCatalogV1ModelsCatalogGet200,
} from '@console/contracts/gateway';
import {
  modelPingV1ModelsModelIdPingGet200Schema,
  modelsCatalogV1ModelsCatalogGet200Schema,
} from '@console/contracts/gateway';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../shared/api/index.ts';
import { GATEWAY_BASE } from '../../../shared/config/index.ts';

export const modelKeys = {
  all: ['models'] as const,
  catalog: () => [...modelKeys.all, 'catalog'] as const,
  ping: (id: string) => [...modelKeys.all, 'ping', id] as const,
};

/** Fetch + runtime-validate the gateway catalog. */
export async function fetchCatalog(
  signal?: AbortSignal,
): Promise<ModelsCatalogV1ModelsCatalogGet200> {
  const raw = await apiGet<unknown>(`${GATEWAY_BASE}/models/catalog`, { signal });
  return modelsCatalogV1ModelsCatalogGet200Schema.parse(raw);
}

/** Probe reachability for a single model. */
export async function pingModel(
  modelId: string,
  signal?: AbortSignal,
): Promise<ModelPingV1ModelsModelIdPingGet200> {
  const raw = await apiGet<unknown>(`${GATEWAY_BASE}/models/${encodeURIComponent(modelId)}/ping`, {
    signal,
  });
  return modelPingV1ModelsModelIdPingGet200Schema.parse(raw);
}

/** React Query hook for the catalog grid. */
export function useModelCatalog() {
  return useQuery({
    queryKey: modelKeys.catalog(),
    queryFn: ({ signal }) => fetchCatalog(signal),
    staleTime: 30_000,
  });
}
