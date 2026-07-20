import type { KnowledgeStats, StatsResponse } from './types.ts';

/** Project the fully-typed RAG `/stats` response into the shape the panel renders. */
export function normalizeStats(raw: StatsResponse): KnowledgeStats {
  return {
    documents: raw.documents,
    chunks: raw.chunks,
  };
}
