import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SERVICES, type ServiceHealthCardLabels } from '../../../entities/service-health/index.ts';
import { Card } from '../../../shared/ui/index.ts';
import styles from './MissionControl.module.css';
import { RoadmapPanel } from './RoadmapPanel.tsx';
import { ServiceHealthTile } from './ServiceHealthTile.tsx';

/** Mission-control board: live service liveness plus the delivery roadmap. */
export function MissionControl() {
  const { t } = useTranslation();

  const labelsFor = useMemo(
    () =>
      (serviceId: string): ServiceHealthCardLabels => ({
        name: t(`mission.service_${serviceId}`),
        latency: t('mission.latency'),
        up: t('mission.status_up'),
        down: t('mission.status_down'),
        checking: t('mission.status_checking'),
      }),
    [t],
  );

  return (
    <div className={styles.grid}>
      <Card as="section" className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('mission.healthTitle')}</h2>
        </header>
        <div className={styles.board}>
          {SERVICES.map((service) => (
            <ServiceHealthTile key={service.id} service={service} labels={labelsFor(service.id)} />
          ))}
        </div>
      </Card>

      <Card as="section" className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('mission.roadmapTitle')}</h2>
        </header>
        <RoadmapPanel />
      </Card>
    </div>
  );
}
