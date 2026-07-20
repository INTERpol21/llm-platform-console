import { useTranslation } from 'react-i18next';
import type { ResearchRun } from '../../../entities/research-run/index.ts';
import { StatTile } from '../../../entities/usage/index.ts';
import { formatMs, formatTokens } from '../../../shared/lib/index.ts';
import styles from './Detail.module.css';
import { EvidenceList } from './EvidenceList.tsx';
import { TraceTimeline } from './TraceTimeline.tsx';

export interface ResearchRunDetailProps {
  run: ResearchRun;
}

/** Estimate a run's token spend from its evidence when the wire omits token counts. */
function evidenceTokens(run: ResearchRun): number {
  return run.evidence.reduce((acc, item) => acc + Math.ceil(item.content.length / 4), 0);
}

/** Expanded research-run view: trace timeline, evidence, answer, and a compact stat summary. */
export function ResearchRunDetail({ run }: ResearchRunDetailProps) {
  const { t } = useTranslation();
  const paragraphs = run.answer.split(/\n{2,}/).filter((block) => block.trim().length > 0);
  const tokens = evidenceTokens(run);

  return (
    <div className={styles.detail} data-testid="research-run-detail">
      <p className={styles.question}>{run.question}</p>

      <div className={styles.tiles}>
        <StatTile label={t('telemetry.latency')} value={formatMs(run.totalMs)} />
        <StatTile label={t('telemetry.iterations')} value={String(run.iterations)} />
        <StatTile label={t('telemetry.evidence')} value={String(run.evidenceCount)} />
        {tokens > 0 ? (
          <StatTile label={t('telemetry.tokens')} value={formatTokens(tokens)} />
        ) : null}
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('telemetry.traceTitle')}</h3>
        <TraceTimeline steps={run.trace} emptyLabel={t('telemetry.traceEmpty')} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('telemetry.evidenceTitle')}</h3>
        {run.evidence.length > 0 ? (
          <EvidenceList
            items={run.evidence}
            labels={{
              sourceRag: t('telemetry.sourceRag'),
              sourceWeb: t('telemetry.sourceWeb'),
              score: t('telemetry.score'),
            }}
          />
        ) : (
          <p className={styles.empty}>{t('telemetry.evidenceEmpty')}</p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('telemetry.answerTitle')}</h3>
        {paragraphs.length > 0 ? (
          <div className={styles.answer} data-testid="research-run-answer">
            {paragraphs.map((block, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are positional
              <p key={index} className={styles.paragraph}>
                {block}
              </p>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>{t('telemetry.answerEmpty')}</p>
        )}
      </section>
    </div>
  );
}
