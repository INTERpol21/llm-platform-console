import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelCatalog } from '../../../entities/models/index.ts';
import type { ResearchStatus } from '../../../entities/research/index.ts';
import { QuestionForm, useResearchStream } from '../../../features/ask-research/index.ts';
import { ModelSelect, useSelectedModel } from '../../../features/select-model/index.ts';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import { Badge, Card } from '../../../shared/ui/index.ts';
import { AnswerView } from './AnswerView.tsx';
import { EvidenceList } from './EvidenceList.tsx';
import styles from './ResearchConsole.module.css';
import { TraceTimeline } from './TraceTimeline.tsx';

const STATUS_TONE: Record<ResearchStatus, BadgeTone> = {
  idle: 'neutral',
  streaming: 'accent',
  done: 'ok',
  error: 'danger',
};

/** Full research surface: question form, live trace, answer with citations, evidence. */
export function ResearchConsole() {
  const { t } = useTranslation();
  const { run, isStreaming, start, stop, reset } = useResearchStream();
  const { data: catalog } = useModelCatalog();
  const selectedModelId = useSelectedModel((s) => s.selectedModelId);
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const handleCite = useCallback((n: number) => {
    setHighlighted(n);
    if (typeof document !== 'undefined') {
      document.getElementById(`evidence-${n}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  const statusLabel = {
    idle: t('research.statusIdle'),
    streaming: t('research.statusStreaming'),
    done: t('research.statusDone'),
    error: t('research.statusError'),
  }[run.status];

  const errorMessage = run.status === 'error' ? (run.error ?? t('research.errorStream')) : null;

  return (
    <div className={styles.console}>
      <Card as="section" className={styles.panel}>
        <QuestionForm
          labels={{
            questionLabel: t('research.questionLabel'),
            questionPlaceholder: t('research.questionPlaceholder'),
            maxIterationsLabel: t('research.maxIterationsLabel'),
            submit: t('research.submit'),
            submitting: t('research.submitting'),
            stop: t('research.stop'),
            clear: t('research.clear'),
          }}
          isStreaming={isStreaming}
          onSubmit={({ question, maxIterations }) =>
            start(question, { maxIterations, model: selectedModelId })
          }
          onStop={stop}
          onClear={reset}
          toolbar={
            <ModelSelect
              options={catalog ?? []}
              label={t('selectModel.label')}
              placeholder={t('selectModel.placeholder')}
            />
          }
        />
      </Card>

      <div className={styles.columns}>
        <Card as="section" className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{t('research.traceTitle')}</h2>
            <Badge tone={STATUS_TONE[run.status]}>{statusLabel}</Badge>
          </header>
          <TraceTimeline
            steps={run.trace}
            isStreaming={isStreaming}
            waitingLabel={t('research.traceWaiting')}
            emptyLabel={t('research.traceEmpty')}
          />
        </Card>

        <div className={styles.results}>
          <Card as="section" className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{t('research.answerTitle')}</h2>
              {run.status === 'done' ? (
                <Badge tone="neutral">
                  {t('research.iterations')}: {run.iterations}
                </Badge>
              ) : null}
            </header>

            {errorMessage ? (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            ) : null}

            {run.answer ? (
              <AnswerView
                text={run.answer}
                citationCount={run.evidence.length}
                onCite={handleCite}
              />
            ) : (
              !errorMessage && (
                <p className={styles.empty}>
                  {isStreaming ? t('research.answerStreaming') : t('research.answerEmpty')}
                </p>
              )
            )}
          </Card>

          <Card as="section" className={styles.panel}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{t('research.evidenceTitle')}</h2>
              {run.evidence.length > 0 ? <Badge tone="neutral">{run.evidence.length}</Badge> : null}
            </header>
            {run.evidence.length > 0 ? (
              <EvidenceList
                items={run.evidence}
                highlighted={highlighted}
                labels={{
                  sourceRag: t('research.sourceRag'),
                  sourceWeb: t('research.sourceWeb'),
                  score: t('research.score'),
                }}
              />
            ) : (
              <p className={styles.empty}>{t('research.evidenceEmpty')}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
