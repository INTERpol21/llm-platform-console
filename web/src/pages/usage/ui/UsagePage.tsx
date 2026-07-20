import { useTranslation } from 'react-i18next';
import { UsageDashboard } from '../../../widgets/usage-dashboard/index.ts';
import styles from './UsagePage.module.css';

export function UsagePage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('usage.title')}</h1>
        <p className={styles.subtitle}>{t('usage.subtitle')}</p>
      </header>
      <UsageDashboard />
    </section>
  );
}
