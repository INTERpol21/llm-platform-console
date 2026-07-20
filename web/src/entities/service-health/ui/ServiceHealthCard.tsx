import { formatMs } from '../../../shared/lib/index.ts';
import { Badge, Card, Spinner } from '../../../shared/ui/index.ts';
import type { ServiceHealth } from '../model/types.ts';
import styles from './ServiceHealthCard.module.css';

export interface ServiceHealthCardLabels {
  name: string;
  latency: string;
  up: string;
  down: string;
  checking: string;
}

export interface ServiceHealthCardProps {
  labels: ServiceHealthCardLabels;
  health?: ServiceHealth;
  isLoading: boolean;
}

/** Presentational liveness tile for one platform service. */
export function ServiceHealthCard({ labels, health, isLoading }: ServiceHealthCardProps) {
  const status = health?.status;
  return (
    <Card as="article" className={styles.card} data-testid="service-health-card">
      <header className={styles.head}>
        <span className={styles.name}>{labels.name}</span>
        {isLoading && !health ? (
          <Badge tone="neutral">
            <Spinner size={12} />
            {labels.checking}
          </Badge>
        ) : (
          <Badge tone={status === 'up' ? 'ok' : 'danger'} data-testid="service-status">
            {status === 'up' ? labels.up : labels.down}
          </Badge>
        )}
      </header>
      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt>{labels.latency}</dt>
          <dd>{health ? formatMs(health.latencyMs) : '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>status</dt>
          <dd className={styles.detail}>{health?.detail ?? '—'}</dd>
        </div>
      </dl>
    </Card>
  );
}
