import type { KnowledgeStats } from '../../../entities/document/index.ts';
import { formatTokens } from '../../../shared/lib/index.ts';
import styles from './StatsPanel.module.css';

export interface StatsPanelLabels {
  documents: string;
  chunks: string;
  empty: string;
}

export interface StatsPanelProps {
  stats: KnowledgeStats;
  labels: StatsPanelLabels;
}

/** Presentational index-stats panel: document and chunk counts. */
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
    </div>
  );
}
