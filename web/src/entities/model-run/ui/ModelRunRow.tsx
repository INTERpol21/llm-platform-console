import { Database, Zap } from 'lucide-react';
import { formatMs, formatPct, formatTokens, formatUsd } from '../../../shared/lib/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import type { ModelRun } from '../model/types.ts';
import styles from './ModelRunRow.module.css';

export interface ModelRunRowLabels {
  tokens: string;
  context: string;
  cost: string;
  latency: string;
  cacheHit: string;
  streaming: string;
}

export interface ModelRunRowProps {
  run: ModelRun;
  labels: ModelRunRowLabels;
  selected: boolean;
  onSelect: () => void;
}

/** Status → badge tone. Anything other than a clean success reads as a warning/danger. */
function statusTone(run: ModelRun): BadgeTone {
  if (run.error) return 'danger';
  const status = run.status.toLowerCase();
  if (status === 'ok' || status === 'success' || status === 'succeeded') return 'ok';
  if (status === 'error' || status === 'failed') return 'danger';
  return 'neutral';
}

/** A single collapsed model-call row: identity plus its headline stats. */
export function ModelRunRow({ run, labels, selected, onSelect }: ModelRunRowProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.row} ${styles.selected}` : styles.row}
      onClick={onSelect}
      aria-pressed={selected}
      aria-expanded={selected}
      data-testid="model-run-row"
    >
      <div className={styles.head}>
        <span className={styles.model}>{run.model}</span>
        <Badge tone="neutral">{run.provider}</Badge>
        <Badge tone={statusTone(run)}>{run.status}</Badge>
        {run.cacheHit ? (
          <Badge tone="accent">
            <Database size={12} aria-hidden="true" />
            {labels.cacheHit}
          </Badge>
        ) : null}
        {run.streaming ? (
          <Badge tone="neutral">
            <Zap size={12} aria-hidden="true" />
            {labels.streaming}
          </Badge>
        ) : null}
      </div>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>{labels.tokens}</dt>
          <dd>{formatTokens(run.totalTokens)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{labels.context}</dt>
          <dd>{formatPct(run.contextUsedPct)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{labels.cost}</dt>
          <dd>{formatUsd(run.costUsd)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>{labels.latency}</dt>
          <dd>{formatMs(run.totalMs)}</dd>
        </div>
      </dl>
    </button>
  );
}
