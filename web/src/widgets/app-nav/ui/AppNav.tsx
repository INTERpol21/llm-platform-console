import { Link } from '@tanstack/react-router';
import { Activity, BookOpen, Boxes, FlaskConical, Gauge, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../../features/switch-language/index.ts';
import { ThemeSwitcher } from '../../../features/switch-theme/index.ts';
import styles from './AppNav.module.css';

/** Top application bar: brand, primary navigation, theme + language controls. */
export function AppNav() {
  const { t } = useTranslation();

  return (
    <header className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true" />
        <span className={styles.title}>{t('app.title')}</span>
      </div>

      <nav className={styles.links}>
        <Link to="/models" className={styles.link} activeProps={{ className: styles.active }}>
          <Boxes size={16} />
          {t('nav.models')}
        </Link>
        <Link to="/research" className={styles.link} activeProps={{ className: styles.active }}>
          <FlaskConical size={16} />
          {t('nav.research')}
        </Link>
        <Link to="/usage" className={styles.link} activeProps={{ className: styles.active }}>
          <Receipt size={16} />
          {t('nav.usage')}
        </Link>
        <Link to="/knowledge" className={styles.link} activeProps={{ className: styles.active }}>
          <BookOpen size={16} />
          {t('nav.knowledge')}
        </Link>
        <Link to="/telemetry" className={styles.link} activeProps={{ className: styles.active }}>
          <Activity size={16} />
          {t('nav.telemetry')}
        </Link>
        <Link to="/mission" className={styles.link} activeProps={{ className: styles.active }}>
          <Gauge size={16} />
          {t('nav.mission')}
        </Link>
      </nav>

      <div className={styles.controls}>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
