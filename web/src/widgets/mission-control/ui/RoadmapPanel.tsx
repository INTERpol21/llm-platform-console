import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../shared/ui/index.ts';
import type { RoadmapItemStatus } from '../model/roadmap.ts';
import { useLiveRoadmap } from '../model/useLiveRoadmap.ts';
import styles from './RoadmapPanel.module.css';

function StatusIcon({ status }: { status: RoadmapItemStatus }) {
  if (status === 'done')
    return <CircleCheck size={16} className={styles.iconDone} aria-hidden="true" />;
  if (status === 'active')
    return <CircleDot size={16} className={styles.iconActive} aria-hidden="true" />;
  return <CircleDashed size={16} className={styles.iconOpen} aria-hidden="true" />;
}

/**
 * The repo's actual plan: sections and checkboxes from docs/ROADMAP.md —
 * live from the main branch via the BFF (refreshed every minute; `[~]`
 * items show as "in progress"), with the build-time copy as offline
 * fallback (see ../model/useLiveRoadmap.ts).
 */
export function RoadmapPanel() {
  const { t } = useTranslation();
  const { sections, live } = useLiveRoadmap();
  return (
    <div className={styles.sections} data-testid="roadmap" data-live={live}>
      {sections.map((section) => (
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
                <StatusIcon status={item.status} />
                <span className={styles.itemTitle}>{item.title}</span>
                {item.status === 'active' ? (
                  // The visible badge already announces the state.
                  <Badge tone="accent">{t('mission.status_active')}</Badge>
                ) : (
                  <span className={styles.srOnly}>
                    {t(item.status === 'done' ? 'mission.status_done' : 'mission.status_open')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
