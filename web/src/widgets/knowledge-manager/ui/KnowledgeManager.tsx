import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStats } from '../../../entities/document/index.ts';
import { IngestForm } from '../../../features/ingest-documents/index.ts';
import { SearchBox } from '../../../features/search-knowledge/index.ts';
import { Button, Card, Spinner } from '../../../shared/ui/index.ts';
import styles from './KnowledgeManager.module.css';
import { StatsPanel } from './StatsPanel.tsx';

/** Full knowledge surface: ingest form, live index stats, and a retrieval query box. */
export function KnowledgeManager() {
  const { t } = useTranslation();
  const { data: stats, isLoading, isError, refetch } = useStats();

  const statsLabels = {
    documents: t('knowledge.statsDocuments'),
    chunks: t('knowledge.statsChunks'),
    sources: t('knowledge.statsSources'),
    empty: t('knowledge.statsEmpty'),
    sourceLocal: t('knowledge.sourceLocal'),
    sourceWeb: t('knowledge.sourceWeb'),
    sourceOther: t('knowledge.sourceOther'),
  };

  return (
    <div className={styles.manager}>
      <div className={styles.column}>
        <Card className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{t('knowledge.ingestTitle')}</h2>
          </header>
          <IngestForm
            labels={{
              titleLabel: t('knowledge.docTitleLabel'),
              titlePlaceholder: t('knowledge.docTitlePlaceholder'),
              textLabel: t('knowledge.docTextLabel'),
              textPlaceholder: t('knowledge.docTextPlaceholder'),
              sourceLabel: t('knowledge.sourceLabel'),
              priorityLabel: t('knowledge.priorityLabel'),
              sourceLocal: t('knowledge.sourceLocal'),
              sourceWeb: t('knowledge.sourceWeb'),
              sourceOther: t('knowledge.sourceOther'),
              submit: t('knowledge.submit'),
              submitting: t('knowledge.submitting'),
              error: t('knowledge.ingestError'),
            }}
            formatSuccess={(result) =>
              t('knowledge.ingestSuccess', {
                chunks: result.chunks_indexed,
                skipped: result.skipped,
              })
            }
            onIngested={() => void refetch()}
          />
        </Card>

        <Card className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{t('knowledge.statsTitle')}</h2>
          </header>
          {isLoading ? (
            <div className={styles.state}>
              <Spinner size={16} />
              <span>{t('common.loading')}</span>
            </div>
          ) : isError || !stats ? (
            <div className={styles.state}>
              <AlertTriangle size={16} />
              <span>{t('knowledge.statsError')}</span>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <StatsPanel stats={stats} labels={statsLabels} />
          )}
        </Card>
      </div>

      <div className={styles.column}>
        <Card className={styles.panel}>
          <header className={styles.panelHead}>
            <h2 className={styles.panelTitle}>{t('knowledge.queryTitle')}</h2>
          </header>
          <SearchBox
            labels={{
              questionLabel: t('knowledge.questionLabel'),
              questionPlaceholder: t('knowledge.questionPlaceholder'),
              topKLabel: t('knowledge.topKLabel'),
              search: t('knowledge.search'),
              searching: t('knowledge.searching'),
              answerTitle: t('knowledge.answerTitle'),
              resultsTitle: t('knowledge.resultsTitle'),
              resultsEmpty: t('knowledge.resultsEmpty'),
              empty: t('knowledge.queryEmpty'),
              error: t('knowledge.queryError'),
              score: t('knowledge.score'),
              sourceLocal: t('knowledge.sourceLocal'),
              sourceWeb: t('knowledge.sourceWeb'),
              sourceOther: t('knowledge.sourceOther'),
            }}
          />
        </Card>
      </div>
    </div>
  );
}
