import type {
  IngestRequest,
  IngestResponse,
  QueryRequest,
  QueryResponse,
  StatsStatsGet200,
} from '@console/contracts/rag';
import {
  ingestResponseSchema,
  queryResponseSchema,
  statsStatsGet200Schema,
} from '@console/contracts/rag';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../../shared/api/index.ts';
import { RAG_BASE } from '../../../shared/config/index.ts';
import { normalizeStats } from '../model/stats.ts';
import type { KnowledgeStats } from '../model/types.ts';

export const documentKeys = {
  all: ['documents'] as const,
  stats: () => [...documentKeys.all, 'stats'] as const,
};

/** Ingest a batch of documents into the retrieval index. */
export async function ingestDocuments(
  body: IngestRequest,
  signal?: AbortSignal,
): Promise<IngestResponse> {
  const raw = await apiPost<unknown>(`${RAG_BASE}/ingest`, body, { signal });
  return ingestResponseSchema.parse(raw);
}

/** Query the retrieval index and return the grounded answer + retrieved chunks. */
export async function queryKnowledge(
  body: QueryRequest,
  signal?: AbortSignal,
): Promise<QueryResponse> {
  const raw = await apiPost<unknown>(`${RAG_BASE}/query`, body, { signal });
  return queryResponseSchema.parse(raw);
}

/** Fetch + runtime-validate the raw index stats object. */
export async function fetchStats(signal?: AbortSignal): Promise<StatsStatsGet200> {
  const raw = await apiGet<unknown>(`${RAG_BASE}/stats`, { signal });
  return statsStatsGet200Schema.parse(raw);
}

/** Mutation wrapper around document ingestion. */
export function useIngest(onSuccess?: (result: IngestResponse) => void) {
  return useMutation({
    mutationFn: (body: IngestRequest) => ingestDocuments(body),
    onSuccess,
  });
}

/** Mutation wrapper around a knowledge-base query (a user-triggered search). */
export function useKnowledgeQuery() {
  return useMutation({
    mutationFn: (body: QueryRequest) => queryKnowledge(body),
  });
}

/** React Query hook returning the normalized index stats. */
export function useStats() {
  return useQuery<StatsStatsGet200, Error, KnowledgeStats>({
    queryKey: documentKeys.stats(),
    queryFn: ({ signal }) => fetchStats(signal),
    select: normalizeStats,
    staleTime: 15_000,
  });
}
