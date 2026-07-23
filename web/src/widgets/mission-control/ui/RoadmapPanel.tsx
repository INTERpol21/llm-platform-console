import { CircleCheck, CircleDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../shared/ui/index.ts';
import { ROADMAP_SECTIONS } from '../model/roadmap.ts';
import styles from './RoadmapPanel.module.css';

/**
 * The repo's actual plan: sections and checkboxes parsed from docs/ROADMAP.md
 * at build time (see ../model/roadmap.ts), not a hand-maintained copy.
 */
export function RoadmapPanel() {
  const { t } = useTranslation();
  return (
    <div className={styles.sections} data-testid="roadmap">
      {ROADMAP_SECTIONS.map((section) => (
        <section key={section.title} className={styles.section}>
          <header className={styles.head}>
            <h3 className={styles.title}>{section.title}</h3>
            <Badge tone={section.done === section.items.length ? 'ok' : 'accent'}>
              {t('mission.sectionProgress', { done: section.done, total: section.items.length })}
            </Badge>
          </header>
          <ul className={styles.list}>
            {section.items.map((item) => (
              <li key={item.title} className={styles.item} data-status={item.status}>
                {item.status === 'done' ? (
                  <CircleCheck size={16} className={styles.iconDone} aria-hidden="true" />
                ) : (
                  <CircleDashed size={16} className={styles.iconOpen} aria-hidden="true" />
                )}
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.srOnly}>
                  {t(item.status === 'done' ? 'mission.status_done' : 'mission.status_open')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
