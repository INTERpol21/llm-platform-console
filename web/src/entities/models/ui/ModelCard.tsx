import type { ReactNode } from 'react';
import { formatMs, formatTokens, formatUsd } from '../../../shared/lib/index.ts';
import { Badge, Card } from '../../../shared/ui/index.ts';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import type { CatalogEntry, PingResult } from '../model/types.ts';
import styles from './ModelCard.module.css';

export interface ModelCardLabels {
  provider: string;
  latency: string;
  context: string;
  pricingInput: string;
  pricingOutput: string;
  streaming: string;
  reachable: string;
  unreachable: string;
}

export interface ModelCardProps {
  entity: CatalogEntry;
  ping?: PingResult | null;
  labels: ModelCardLabels;
  actions?: ReactNode;
}

function statusTone(status: string): BadgeTone {
  const value = status.toLowerCase();
  if (['ok', 'ready', 'healthy', 'online', 'available'].includes(value)) return 'ok';
  if (['degraded', 'slow', 'warn', 'warning', 'limited'].includes(value)) return 'warn';
  if (['down', 'error', 'offline', 'unavailable', 'failed'].includes(value)) return 'danger';
  return 'neutral';
}

/** Presentational catalog card for one model. Ping data and actions are injected. */
export function ModelCard({ entity, ping, labels, actions }: ModelCardProps) {
  const latency = ping?.latency_ms ?? entity.latency_ms ?? null;

  return (
    <Card as="article" interactive className={styles.card}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <h3 className={styles.id}>{entity.id}</h3>
          <span className={styles.provider}>
            {labels.provider}: {entity.provider}
          </span>
        </div>
        <Badge tone={statusTone(entity.status)}>{entity.status}</Badge>
      </header>

      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{labels.latency}</dt>
          <dd>{formatMs(latency)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{labels.context}</dt>
          <dd>{entity.context_window ? formatTokens(entity.context_window) : '—'}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{labels.pricingInput}</dt>
          <dd>{formatUsd(entity.pricing.input_per_1k)}</dd>
        </div>
        <div className={styles.metric}>
          <dt>{labels.pricingOutput}</dt>
          <dd>{formatUsd(entity.pricing.output_per_1k)}</dd>
        </div>
      </dl>

      <footer className={styles.footer}>
        <div className={styles.flags}>
          {entity.streaming !== false ? <Badge tone="accent">{labels.streaming}</Badge> : null}
          {ping ? (
            <Badge tone={ping.reachable ? 'ok' : 'danger'} data-testid="ping-status">
              {ping.reachable ? labels.reachable : labels.unreachable}
            </Badge>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </footer>
    </Card>
  );
}
