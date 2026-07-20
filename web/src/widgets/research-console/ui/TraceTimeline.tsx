import styles from './TraceTimeline.module.css';

export interface TraceTimelineProps {
  steps: string[];
  isStreaming: boolean;
  waitingLabel: string;
  emptyLabel: string;
}

/** Live, ordered timeline of agent reasoning steps. */
export function TraceTimeline({
  steps,
  isStreaming,
  waitingLabel,
  emptyLabel,
}: TraceTimelineProps) {
  if (steps.length === 0) {
    return <p className={styles.empty}>{isStreaming ? waitingLabel : emptyLabel}</p>;
  }

  return (
    <ol className={styles.timeline} data-testid="trace-timeline">
      {steps.map((step, index) => (
        // Trace steps are an append-only ordered log; index is a stable key here.
        // biome-ignore lint/suspicious/noArrayIndexKey: append-only ordered log
        <li key={index} className={styles.item}>
          <span className={styles.marker} aria-hidden="true" />
          <span className={styles.step}>{step}</span>
        </li>
      ))}
      {isStreaming ? (
        <li className={`${styles.item} ${styles.pending}`}>
          <span className={`${styles.marker} ${styles.markerPending}`} aria-hidden="true" />
          <span className={styles.step}>{waitingLabel}</span>
        </li>
      ) : null}
    </ol>
  );
}
