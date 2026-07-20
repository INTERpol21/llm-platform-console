import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelRunRow, useModelRuns } from '../../../entities/model-run/index.ts';
import { Button, Card, Spinner } from '../../../shared/ui/index.ts';
import { ModelRunDetail } from './ModelRunDetail.tsx';
import styles from './Panel.module.css';

/** "Model calls" tab: paginated model-run list plus the selected run's detail. */
export function ModelRunsPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useModelRuns();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.state}>
        <Spinner size={18} />
        <span>{t('telemetry.loading')}</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.state} data-testid="telemetry-error">
        <AlertTriangle size={18} />
        <span>{t('telemetry.error')}</span>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className={styles.state} data-testid="telemetry-disabled">
        {t('telemetry.disabled')}
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className={styles.state} data-testid="telemetry-empty">
        {t('telemetry.empty')}
      </div>
    );
  }

  const active = data.items.find((run) => run.id === selectedId) ?? data.items[0];
  if (!active) return null;

  return (
    <div className={styles.columns}>
      <div className={styles.list}>
        {data.items.map((run) => (
          <ModelRunRow
            key={run.id}
            run={run}
            selected={run.id === active.id}
            onSelect={() => setSelectedId(run.id)}
            labels={{
              tokens: t('telemetry.tokens'),
              context: t('telemetry.context'),
              cost: t('telemetry.cost'),
              latency: t('telemetry.latency'),
              cacheHit: t('telemetry.cacheHit'),
              streaming: t('telemetry.streaming'),
            }}
          />
        ))}
        {hasNextPage ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            data-testid="load-more"
          >
            {isFetchingNextPage ? t('telemetry.loadingMore') : t('telemetry.loadMore')}
          </Button>
        ) : null}
      </div>

      <Card className={styles.detailCard}>
        <ModelRunDetail run={active} />
      </Card>
    </div>
  );
}
