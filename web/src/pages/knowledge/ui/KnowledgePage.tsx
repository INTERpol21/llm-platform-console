import { useTranslation } from 'react-i18next';
import { KnowledgeManager } from '../../../widgets/knowledge-manager/index.ts';
import styles from './KnowledgePage.module.css';

export function KnowledgePage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('knowledge.title')}</h1>
        <p className={styles.subtitle}>{t('knowledge.subtitle')}</p>
      </header>
      <KnowledgeManager />
    </section>
  );
}
