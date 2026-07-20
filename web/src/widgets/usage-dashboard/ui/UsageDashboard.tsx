import * as Tabs from '@radix-ui/react-tabs';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatTile, useUsage } from '../../../entities/usage/index.ts';
import { formatTokens, formatUsd } from '../../../shared/lib/index.ts';
import { Button, Card, Spinner } from '../../../shared/ui/index.ts';
import styles from './UsageDashboard.module.css';

type Metric = 'requests' | 'tokens' | 'cost';

/** Usage overview: totals as stat tiles, a per-model bar chart, and a breakdown table. */
export function UsageDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useUsage();
  const [metric, setMetric] = useState<Metric>('cost');

  if (isLoading) {
    return (
      <div className={styles.state}>
        <Spinner size={18} />
        <span>{t('usage.loading')}</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={18} />
        <span>{t('usage.error')}</span>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (data.models.length === 0) {
    return (
      <div className={styles.state} data-testid="usage-empty">
        {t('usage.empty')}
      </div>
    );
  }

  const chartData = data.models.map((row) => ({
    model: row.model,
    requests: row.requests,
    tokens: row.tokens,
    cost: row.cost_usd,
  }));

  const metricLabel: Record<Metric, string> = {
    requests: t('usage.metricRequests'),
    tokens: t('usage.metricTokens'),
    cost: t('usage.metricCost'),
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.tiles}>
        <StatTile label={t('usage.requests')} value={data.totalRequests.toLocaleString()} />
        <StatTile label={t('usage.tokens')} value={formatTokens(data.totalTokens)} />
        <StatTile label={t('usage.cost')} value={formatUsd(data.totalCostUsd)} />
      </div>

      <Card as="section" className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('usage.chartTitle')}</h2>
        </header>

        <Tabs.Root value={metric} onValueChange={(value) => setMetric(value as Metric)}>
          <Tabs.List className={styles.tabs} aria-label={t('usage.chartTitle')}>
            {(['requests', 'tokens', 'cost'] as Metric[]).map((key) => (
              <Tabs.Trigger key={key} value={key} className={styles.tab}>
                {metricLabel[key]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <div className={styles.chart} data-testid="usage-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="model" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" width={56} />
              <Tooltip
                cursor={{ fill: 'var(--color-accent-soft)' }}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey={metric}
                name={metricLabel[metric]}
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card as="section" className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('usage.byModel')}</h2>
        </header>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('usage.model')}</th>
              <th>{t('usage.requests')}</th>
              <th>{t('usage.tokens')}</th>
              <th>{t('usage.cost')}</th>
            </tr>
          </thead>
          <tbody>
            {data.models.map((row) => (
              <tr key={row.model} data-testid="usage-row">
                <td className={styles.model}>{row.model}</td>
                <td>{row.requests.toLocaleString()}</td>
                <td>{formatTokens(row.tokens)}</td>
                <td>{formatUsd(row.cost_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
