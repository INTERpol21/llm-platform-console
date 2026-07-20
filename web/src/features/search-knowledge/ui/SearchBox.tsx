import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useKnowledgeQuery } from '../../../entities/document/index.ts';
import type { BadgeTone } from '../../../shared/ui/index.ts';
import { Badge, Button, Spinner } from '../../../shared/ui/index.ts';
import styles from './SearchBox.module.css';

export interface SearchBoxLabels {
  questionLabel: string;
  questionPlaceholder: string;
  topKLabel: string;
  search: string;
  searching: string;
  answerTitle: string;
  resultsTitle: string;
  resultsEmpty: string;
  empty: string;
  error: string;
  score: string;
  sourceLocal: string;
  sourceWeb: string;
  sourceOther: string;
}

export interface SearchBoxProps {
  labels: SearchBoxLabels;
}

function sourceBadge(
  source: string | undefined,
  labels: SearchBoxLabels,
): { tone: BadgeTone; text: string } {
  switch (source) {
    case 'web':
      return { tone: 'accent', text: labels.sourceWeb };
    case 'other':
      return { tone: 'warn', text: labels.sourceOther };
    case 'local':
      return { tone: 'neutral', text: labels.sourceLocal };
    default:
      return { tone: 'neutral', text: source ?? labels.sourceLocal };
  }
}

/** Query box: question → POST /query → grounded answer + retrieved chunks with source badges. */
export function SearchBox({ labels }: SearchBoxProps) {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(4);
  const query = useKnowledgeQuery();

  const canSubmit = question.trim().length > 0 && !query.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    query.mutate({ question: question.trim(), top_k: topK });
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>{labels.questionLabel}</span>
          <textarea
            className={styles.textarea}
            value={question}
            placeholder={labels.questionPlaceholder}
            onChange={(event) => setQuestion(event.target.value)}
            rows={2}
            disabled={query.isPending}
          />
        </label>
        <div className={styles.toolbar}>
          <label className={styles.topK}>
            <span className={styles.label}>{labels.topKLabel}</span>
            <input
              className={styles.number}
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(event) => setTopK(Number(event.target.value))}
              disabled={query.isPending}
            />
          </label>
          <div className={styles.actions}>
            <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
              {query.isPending ? <Spinner size={14} /> : <Search size={14} />}
              {query.isPending ? labels.searching : labels.search}
            </Button>
          </div>
        </div>
      </form>

      {query.isError ? (
        <p className={styles.error} role="alert" data-testid="query-error">
          {labels.error}
        </p>
      ) : null}

      {query.isSuccess ? (
        <div className={styles.results}>
          {query.data.answer ? (
            <div className={styles.answerBlock}>
              <span className={styles.blockTitle}>{labels.answerTitle}</span>
              <p className={styles.answer} data-testid="query-answer">
                {query.data.answer}
              </p>
            </div>
          ) : null}

          <div className={styles.answerBlock}>
            <span className={styles.blockTitle}>{labels.resultsTitle}</span>
            {query.data.retrieved.length > 0 ? (
              <ol className={styles.list}>
                {query.data.retrieved.map((chunk, index) => {
                  const badge = sourceBadge(chunk.source, labels);
                  return (
                    <li key={chunk.chunk_id} className={styles.chunk} data-testid="chunk-item">
                      <div className={styles.chunkHead}>
                        <span className={styles.index}>[{index + 1}]</span>
                        <Badge tone={badge.tone}>{badge.text}</Badge>
                        <span className={styles.score}>
                          {labels.score}: {chunk.score.toFixed(2)}
                        </span>
                      </div>
                      <p className={styles.chunkTitle}>{chunk.title}</p>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.empty}>{labels.resultsEmpty}</p>
            )}
          </div>
        </div>
      ) : query.isPending ? null : (
        <p className={styles.empty}>{labels.empty}</p>
      )}
    </div>
  );
}
