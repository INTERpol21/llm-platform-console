import { useTranslation } from 'react-i18next';
import type { ModelRun } from '../../../entities/model-run/index.ts';
import { StatTile } from '../../../entities/usage/index.ts';
import { formatMs, formatPct, formatTokens, formatUsd } from '../../../shared/lib/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import styles from './Detail.module.css';

export interface ModelRunDetailProps {
  run: ModelRun;
}

/** Expanded model-call view: identity, token breakdown, context, cost, latency, cache, error. */
export function ModelRunDetail({ run }: ModelRunDetailProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.detail} data-testid="model-run-detail">
      <div className={styles.head}>
        <span className={styles.title}>{run.model}</span>
        <Badge tone="neutral">{run.provider}</Badge>
        {run.servedModel ? (
          <Badge tone="neutral">
            {t('telemetry.servedModel')}: {run.servedModel}
          </Badge>
        ) : null}
        <Badge tone={run.error ? 'danger' : 'ok'}>{run.status}</Badge>
        <Badge tone={run.cacheHit ? 'accent' : 'neutral'}>
          {run.cacheHit ? t('telemetry.cacheHit') : t('telemetry.cacheMiss')}
        </Badge>
        {run.streaming ? <Badge tone="neutral">{t('telemetry.streaming')}</Badge> : null}
      </div>

      {run.requestId ? (
        <p className={styles.meta}>
          {t('telemetry.requestId')}: <code>{run.requestId}</code>
        </p>
      ) : null}

      <div className={styles.tiles}>
        <StatTile label={t('telemetry.promptTokens')} value={formatTokens(run.promptTokens)} />
        <StatTile
          label={t('telemetry.completionTokens')}
          value={formatTokens(run.completionTokens)}
        />
        <StatTile label={t('telemetry.totalTokens')} value={formatTokens(run.totalTokens)} />
        <StatTile
          label={t('telemetry.context')}
          value={formatPct(run.contextUsedPct)}
          hint={
            run.contextWindow
              ? `${t('telemetry.contextWindow')}: ${formatTokens(run.contextWindow)}`
              : undefined
          }
        />
        <StatTile label={t('telemetry.cost')} value={formatUsd(run.costUsd)} />
        <StatTile label={t('telemetry.latency')} value={formatMs(run.totalMs)} />
      </div>

      {run.error ? (
        <p className={styles.error} role="alert" data-testid="model-run-error">
          {run.error}
        </p>
      ) : null}
    </div>
  );
}
