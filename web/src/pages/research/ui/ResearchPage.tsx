import { useTranslation } from 'react-i18next';
import { ResearchConsole } from '../../../widgets/research-console/index.ts';
import styles from './ResearchPage.module.css';

export function ResearchPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('research.title')}</h1>
        <p className={styles.subtitle}>{t('research.subtitle')}</p>
      </header>
      <ResearchConsole />
    </section>
  );
}
