import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import { Badge } from '../../../shared/ui/index.ts';
import styles from './RoadmapPanel.module.css';

type MilestoneStatus = 'done' | 'active' | 'planned';

interface Milestone {
  id: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  status: MilestoneStatus;
}

/** Delivery milestones mirror the project plan; status is maintained here. */
const MILESTONES: readonly Milestone[] = [
  { id: 'm1', status: 'done' },
  { id: 'm2', status: 'done' },
  { id: 'm3', status: 'done' },
  { id: 'm4', status: 'active' },
  { id: 'm5', status: 'planned' },
];

const STATUS_TONE: Record<MilestoneStatus, BadgeTone> = {
  done: 'ok',
  active: 'accent',
  planned: 'neutral',
};

function StatusIcon({ status }: { status: MilestoneStatus }) {
  if (status === 'done')
    return <CircleCheck size={16} className={styles.iconDone} aria-hidden="true" />;
  if (status === 'active')
    return <CircleDot size={16} className={styles.iconActive} aria-hidden="true" />;
  return <CircleDashed size={16} className={styles.iconPlanned} aria-hidden="true" />;
}

/** Static roadmap board: the M1–M5 milestones and their current status. */
export function RoadmapPanel() {
  const { t } = useTranslation();
  return (
    <ol className={styles.list} data-testid="roadmap">
      {MILESTONES.map((milestone) => (
        <li key={milestone.id} className={styles.item}>
          <StatusIcon status={milestone.status} />
          <div className={styles.body}>
            <div className={styles.head}>
              <span className={styles.title}>{t(`mission.${milestone.id}_title`)}</span>
              <Badge tone={STATUS_TONE[milestone.status]}>
                {t(`mission.status_${milestone.status}`)}
              </Badge>
            </div>
            <p className={styles.detail}>{t(`mission.${milestone.id}_detail`)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
