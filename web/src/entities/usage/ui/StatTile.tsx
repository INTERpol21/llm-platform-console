import type { ReactNode } from 'react';
import styles from './StatTile.module.css';

export interface StatTileProps {
  label: string;
  value: string;
  hint?: ReactNode;
}

/** A single labelled metric tile used across the usage dashboard. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className={styles.tile} data-testid="stat-tile">
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
