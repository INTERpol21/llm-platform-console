import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelCard, useModelCatalog } from '../../../entities/models/index.ts';
import type { PingResult } from '../../../entities/models/index.ts';
import { PingButton } from '../../../features/ping-model/index.ts';
import { Button, Spinner } from '../../../shared/ui/index.ts';
import styles from './ModelCatalog.module.css';

/** Grid of model cards with an inline reachability probe per card. */
export function ModelCatalog() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useModelCatalog();
  const [pings, setPings] = useState<Record<string, PingResult>>({});

  const cardLabels = {
    provider: t('model.provider'),
    latency: t('model.latency'),
    context: t('model.context'),
    pricingInput: t('model.pricingInput'),
    pricingOutput: t('model.pricingOutput'),
    streaming: t('model.streaming'),
    reachable: t('ping.reachable'),
    unreachable: t('ping.unreachable'),
  };

  if (isLoading) {
    return (
      <div className={styles.state}>
        <Spinner size={18} />
        <span>{t('models.loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={18} />
        <span>{t('models.error')}</span>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className={styles.state}>{t('models.empty')}</div>;
  }

  return (
    <div className={styles.grid}>
      {data.map((entity) => (
        <ModelCard
          key={entity.id}
          entity={entity}
          ping={pings[entity.id] ?? null}
          labels={cardLabels}
          actions={
            <PingButton
              modelId={entity.id}
              labels={{ action: t('ping.action'), pinging: t('ping.pinging') }}
              onResult={(result) => setPings((prev) => ({ ...prev, [entity.id]: result }))}
            />
          }
        />
      ))}
    </div>
  );
}
