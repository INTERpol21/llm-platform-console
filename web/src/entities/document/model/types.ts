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
  StatsResponse,
  StatsStatsGet200,
} from '@console/contracts/rag';

/**
 * Index stats the panel renders, projected from the generated `StatsResponse`
 * contract — see `stats.ts` for the (fully typed) mapping.
 */
export interface KnowledgeStats {
  documents: number;
  chunks: number;
}
