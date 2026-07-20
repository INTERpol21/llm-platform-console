import { Send, Square, Trash2 } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '../../../shared/ui/index.ts';
import styles from './QuestionForm.module.css';

export interface QuestionFormLabels {
  questionLabel: string;
  questionPlaceholder: string;
  maxIterationsLabel: string;
  submit: string;
  submitting: string;
  stop: string;
  clear: string;
}

export interface QuestionFormValues {
  question: string;
  maxIterations: number;
}

export interface QuestionFormProps {
  labels: QuestionFormLabels;
  isStreaming: boolean;
  onSubmit: (values: QuestionFormValues) => void;
  onStop: () => void;
  onClear: () => void;
  /** Slot for the model selector rendered inline in the toolbar. */
  toolbar?: ReactNode;
  defaultMaxIterations?: number;
}

export function QuestionForm({
  labels,
  isStreaming,
  onSubmit,
  onStop,
  onClear,
  toolbar,
  defaultMaxIterations = 3,
}: QuestionFormProps) {
  const [question, setQuestion] = useState('');
  const [maxIterations, setMaxIterations] = useState(defaultMaxIterations);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;
    onSubmit({ question: trimmed, maxIterations });
  };

  const handleClear = () => {
    setQuestion('');
    onClear();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>{labels.questionLabel}</span>
        <textarea
          className={styles.textarea}
          placeholder={labels.questionPlaceholder}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          disabled={isStreaming}
        />
      </label>

      <div className={styles.toolbar}>
        {toolbar}
        <label className={styles.iterations}>
          <span className={styles.label}>{labels.maxIterationsLabel}</span>
          <input
            className={styles.number}
            type="number"
            min={1}
            max={10}
            value={maxIterations}
            onChange={(event) => setMaxIterations(Number(event.target.value))}
            disabled={isStreaming}
          />
        </label>

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={handleClear} disabled={isStreaming}>
            <Trash2 size={14} />
            {labels.clear}
          </Button>
          {isStreaming ? (
            <Button variant="danger" size="sm" onClick={onStop}>
              <Square size={14} />
              {labels.stop}
            </Button>
          ) : (
            <Button variant="primary" size="sm" type="submit" disabled={!question.trim()}>
              <Send size={14} />
              {labels.submit}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
