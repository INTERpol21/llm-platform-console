// Re-export the generated RAG contract types — never redefined here.
export type {
  CitationOut,
  DocumentIn,
  DocumentInSourceEnum,
  IngestRequest,
  IngestResponse,
  QueryRequest,
  QueryRequestSourcesEnum,
  QueryResponse,
  RetrievedChunkOut,
  StatsStatsGet200,
} from '@console/contracts/rag';

/** One source's contribution to the index, normalized from the open stats object. */
export interface KnowledgeSourceStat {
  source: string;
  count: number;
}

/**
 * Normalized view of the RAG `/stats` response. The wire schema is an open
 * object, so this is the shape the stats panel actually renders.
 */
export interface KnowledgeStats {
  documents: number;
  chunks: number;
  sources: KnowledgeSourceStat[];
}
