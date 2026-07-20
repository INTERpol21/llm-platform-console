import { useTranslation } from 'react-i18next';
import { TelemetryExplorer } from '../../../widgets/telemetry-explorer/index.ts';
import styles from './TelemetryPage.module.css';

export function TelemetryPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('telemetry.title')}</h1>
        <p className={styles.subtitle}>{t('telemetry.subtitle')}</p>
      </header>
      <TelemetryExplorer />
    </section>
  );
}
