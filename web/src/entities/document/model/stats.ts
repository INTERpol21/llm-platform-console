import type { StatsStatsGet200 } from '@console/contracts/rag';
import type { KnowledgeSourceStat, KnowledgeStats } from './types.ts';

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Fold the open-ended RAG `/stats` object into a stable shape. Tolerant to the
 * common field aliases and to `sources` arriving as either an array of rows or
 * a `{ source: count }` map.
 */
export function normalizeStats(raw: StatsStatsGet200): KnowledgeStats {
  const s = raw as Record<string, unknown>;
  const documents = num(s.documents ?? s.document_count ?? s.total_documents ?? s.docs);
  const chunks = num(s.chunks ?? s.chunk_count ?? s.total_chunks ?? s.vectors);

  const rawSources = s.sources ?? s.by_source;
  const sources: KnowledgeSourceStat[] = [];

  if (Array.isArray(rawSources)) {
    for (const item of rawSources) {
      if (item && typeof item === 'object') {
        const r = item as Record<string, unknown>;
        const name =
          typeof r.source === 'string' ? r.source : typeof r.name === 'string' ? r.name : 'unknown';
        sources.push({ source: name, count: num(r.count ?? r.chunks ?? r.documents) });
      }
    }
  } else if (rawSources && typeof rawSources === 'object') {
    for (const [name, value] of Object.entries(rawSources as Record<string, unknown>)) {
      const count =
        typeof value === 'number' ? value : num((value as Record<string, unknown>)?.count);
      sources.push({ source: name, count });
    }
  }

  return { documents, chunks, sources };
}
