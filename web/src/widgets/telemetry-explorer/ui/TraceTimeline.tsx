import styles from './TraceTimeline.module.css';

export interface TraceTimelineProps {
  steps: string[];
  emptyLabel: string;
}

/** Static, ordered timeline of a completed run's reasoning steps (plan→…→synthesize). */
export function TraceTimeline({ steps, emptyLabel }: TraceTimelineProps) {
  if (steps.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <ol className={styles.timeline} data-testid="trace-timeline">
      {steps.map((step, index) => (
        // Trace steps are an ordered, positional log; index is a stable key here.
        // biome-ignore lint/suspicious/noArrayIndexKey: ordered positional log
        <li key={index} className={styles.item}>
          <span className={styles.marker} aria-hidden="true" />
          <span className={styles.step}>{step}</span>
        </li>
      ))}
    </ol>
  );
}
