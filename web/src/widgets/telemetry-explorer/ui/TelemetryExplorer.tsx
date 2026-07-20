import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelRunsPanel } from './ModelRunsPanel.tsx';
import { ResearchRunsPanel } from './ResearchRunsPanel.tsx';
import styles from './TelemetryExplorer.module.css';

type TabKey = 'model-calls' | 'research-runs';

/** Telemetry explorer: model-call and research-run history behind two tabs. */
export function TelemetryExplorer() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('model-calls');

  return (
    <Tabs.Root value={tab} onValueChange={(value) => setTab(value as TabKey)}>
      <Tabs.List className={styles.tabs} aria-label={t('telemetry.title')}>
        <Tabs.Trigger value="model-calls" className={styles.tab}>
          {t('telemetry.tabModelCalls')}
        </Tabs.Trigger>
        <Tabs.Trigger value="research-runs" className={styles.tab}>
          {t('telemetry.tabResearchRuns')}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="model-calls" className={styles.content}>
        <ModelRunsPanel />
      </Tabs.Content>
      <Tabs.Content value="research-runs" className={styles.content}>
        <ResearchRunsPanel />
      </Tabs.Content>
    </Tabs.Root>
  );
}
