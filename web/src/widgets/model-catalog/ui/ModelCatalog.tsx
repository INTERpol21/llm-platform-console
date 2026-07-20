import { AlertTriangle } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelCard, useModelCatalog } from '../../../entities/models/index.ts';
import type { CatalogEntry, ModelCardLabels, PingResult } from '../../../entities/models/index.ts';
import { PingButton } from '../../../features/ping-model/index.ts';
import { Button, Spinner } from '../../../shared/ui/index.ts';
import styles from './ModelCatalog.module.css';

interface CatalogCardProps {
  entity: CatalogEntry;
  labels: ModelCardLabels;
  pingLabels: { action: string; pinging: string };
}

/**
 * One catalog card that owns its own ping state. Keeping the ping result local
 * means probing one model re-renders only that card, not the whole grid.
 */
const CatalogCard = memo(function CatalogCard({ entity, labels, pingLabels }: CatalogCardProps) {
  const [ping, setPing] = useState<PingResult | null>(null);
  return (
    <ModelCard
      entity={entity}
      ping={ping}
      labels={labels}
      actions={<PingButton modelId={entity.id} labels={pingLabels} onResult={setPing} />}
    />
  );
});

/** Grid of model cards with an inline reachability probe per card. */
export function ModelCatalog() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useModelCatalog();

  const cardLabels = useMemo<ModelCardLabels>(
    () => ({
      provider: t('model.provider'),
      latency: t('model.latency'),
      context: t('model.context'),
      pricingInput: t('model.pricingInput'),
      pricingOutput: t('model.pricingOutput'),
      streaming: t('model.streaming'),
      reachable: t('ping.reachable'),
      unreachable: t('ping.unreachable'),
    }),
    [t],
  );
  const pingLabels = useMemo(() => ({ action: t('ping.action'), pinging: t('ping.pinging') }), [t]);

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
        <CatalogCard key={entity.id} entity={entity} labels={cardLabels} pingLabels={pingLabels} />
      ))}
    </div>
  );
}
