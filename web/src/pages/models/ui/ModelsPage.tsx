import { useTranslation } from 'react-i18next';
import { ModelCatalog } from '../../../widgets/model-catalog/index.ts';
import styles from './ModelsPage.module.css';

export function ModelsPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('models.title')}</h1>
        <p className={styles.subtitle}>{t('models.subtitle')}</p>
      </header>
      <ModelCatalog />
    </section>
  );
}
