import { formatMs } from '../../../shared/lib/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import type { ResearchRun } from '../model/types.ts';
import styles from './ResearchRunSummary.module.css';

export interface ResearchRunSummaryLabels {
  iterations: string;
  evidence: string;
  latency: string;
}

export interface ResearchRunSummaryProps {
  run: ResearchRun;
  labels: ResearchRunSummaryLabels;
  selected: boolean;
  onSelect: () => void;
}

/** A single collapsed research-run row: the question plus its headline stats. */
export function ResearchRunSummary({ run, labels, selected, onSelect }: ResearchRunSummaryProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.row} ${styles.selected}` : styles.row}
      onClick={onSelect}
      aria-pressed={selected}
      aria-expanded={selected}
      data-testid="research-run-row"
    >
      <div className={styles.head}>
        <span className={styles.question}>{run.question}</span>
        {run.mode ? <Badge tone="accent">{run.mode}</Badge> : null}
        {run.model ? <Badge tone="neutral">{run.model}</Badge> : null}
      </div>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>{labels.iterations}</dt>
          <dd>{run.iterations}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{labels.evidence}</dt>
          <dd>{run.evidenceCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{labels.latency}</dt>
          <dd>{formatMs(run.totalMs)}</dd>
        </div>
      </dl>
    </button>
  );
}
