import { useTranslation } from 'react-i18next';
import { MissionControl } from '../../../widgets/mission-control/index.ts';
import styles from './MissionControlPage.module.css';

export function MissionControlPage() {
  const { t } = useTranslation();
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('mission.title')}</h1>
        <p className={styles.subtitle}>{t('mission.subtitle')}</p>
      </header>
      <MissionControl />
    </section>
  );
}
