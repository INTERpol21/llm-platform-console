import type { Evidence } from '../../../entities/research-run/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import styles from './EvidenceList.module.css';

export interface EvidenceListLabels {
  sourceRag: string;
  sourceWeb: string;
  score: string;
}

export interface EvidenceListProps {
  items: Evidence[];
  labels: EvidenceListLabels;
}

/** Numbered evidence cards with a source badge and optional retrieval score. */
export function EvidenceList({ items, labels }: EvidenceListProps) {
  return (
    <ol className={styles.list}>
      {items.map((item, index) => {
        const n = index + 1;
        const sourceLabel = item.source === 'web' ? labels.sourceWeb : labels.sourceRag;
        return (
          <li key={`${item.ref}-${index}`} className={styles.card} data-testid="evidence-item">
            <div className={styles.head}>
              <span className={styles.index}>[{n}]</span>
              <Badge tone={item.source === 'web' ? 'accent' : 'neutral'} data-testid="source-badge">
                {sourceLabel}
              </Badge>
              {typeof item.score === 'number' ? (
                <span className={styles.score}>
                  {labels.score}: {item.score.toFixed(2)}
                </span>
              ) : null}
            </div>
            <p className={styles.ref}>{item.ref}</p>
            <p className={styles.content}>{item.content}</p>
          </li>
        );
      })}
    </ol>
  );
}
