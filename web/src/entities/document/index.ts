// Public API is the hooks + types; the raw fetchers/keys/normalizer are
// slice-internal (nothing outside ever imported them).
export { useIngest, useKnowledgeQuery, useStats } from './api/documents.ts';
export type {
  CitationOut,
  DocumentIn,
  DocumentInSourceEnum,
  IngestRequest,
  IngestResponse,
  KnowledgeStats,
  QueryRequest,
  QueryRequestSourcesEnum,
  QueryResponse,
  RetrievedChunkOut,
  StatsResponse,
  StatsV1StatsGet200,
} from './model/types.ts';
