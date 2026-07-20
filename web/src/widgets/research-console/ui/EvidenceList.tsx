import type { Evidence } from '../../../entities/research/index.ts';
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
  highlighted: number | null;
}

/** Numbered evidence cards; each is a scroll target for its `[n]` citation. */
export function EvidenceList({ items, labels, highlighted }: EvidenceListProps) {
  return (
    <ol className={styles.list}>
      {items.map((item, index) => {
        const n = index + 1;
        const sourceLabel = item.source === 'web' ? labels.sourceWeb : labels.sourceRag;
        return (
          <li
            key={`${item.ref}-${index}`}
            id={`evidence-${n}`}
            className={n === highlighted ? `${styles.card} ${styles.active}` : styles.card}
            data-testid="evidence-item"
          >
            <div className={styles.head}>
              <span className={styles.index}>[{n}]</span>
              <Badge tone={item.source === 'web' ? 'accent' : 'neutral'}>{sourceLabel}</Badge>
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
