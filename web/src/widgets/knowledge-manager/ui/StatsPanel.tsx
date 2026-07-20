import type { KnowledgeStats } from '../../../entities/document/index.ts';
import { formatTokens } from '../../../shared/lib/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import styles from './StatsPanel.module.css';

export interface StatsPanelLabels {
  documents: string;
  chunks: string;
  sources: string;
  empty: string;
  sourceLocal: string;
  sourceWeb: string;
  sourceOther: string;
}

export interface StatsPanelProps {
  stats: KnowledgeStats;
  labels: StatsPanelLabels;
}

function sourceBadge(source: string, labels: StatsPanelLabels): { tone: BadgeTone; text: string } {
  switch (source) {
    case 'web':
      return { tone: 'accent', text: labels.sourceWeb };
    case 'other':
      return { tone: 'warn', text: labels.sourceOther };
    case 'local':
      return { tone: 'neutral', text: labels.sourceLocal };
    default:
      return { tone: 'neutral', text: source };
  }
}

/** Presentational index-stats panel: document/chunk counts + per-source breakdown. */
export function StatsPanel({ stats, labels }: StatsPanelProps) {
  const isEmpty = stats.documents === 0 && stats.chunks === 0;

  if (isEmpty) {
    return (
      <p className={styles.empty} data-testid="stats-empty">
        {labels.empty}
      </p>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.counts}>
        <div className={styles.count}>
          <span className={styles.label}>{labels.documents}</span>
          <span className={styles.value} data-testid="stats-documents">
            {stats.documents.toLocaleString()}
          </span>
        </div>
        <div className={styles.count}>
          <span className={styles.label}>{labels.chunks}</span>
          <span className={styles.value} data-testid="stats-chunks">
            {formatTokens(stats.chunks)}
          </span>
        </div>
      </div>

      {stats.sources.length > 0 ? (
        <div className={styles.sources}>
          <span className={styles.label}>{labels.sources}</span>
          <div className={styles.badges}>
            {stats.sources.map((entry) => {
              const badge = sourceBadge(entry.source, labels);
              return (
                <Badge key={entry.source} tone={badge.tone}>
                  {badge.text}: {entry.count.toLocaleString()}
                </Badge>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
