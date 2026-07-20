import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { DocumentInSourceEnum, IngestResponse } from '../../../entities/document/index.ts';
import { useIngest } from '../../../entities/document/index.ts';
import { Button, Spinner } from '../../../shared/ui/index.ts';
import styles from './IngestForm.module.css';

export interface IngestFormLabels {
  titleLabel: string;
  titlePlaceholder: string;
  textLabel: string;
  textPlaceholder: string;
  sourceLabel: string;
  priorityLabel: string;
  sourceLocal: string;
  sourceWeb: string;
  sourceOther: string;
  submit: string;
  submitting: string;
  error: string;
}

export interface IngestFormProps {
  labels: IngestFormLabels;
  /** Render the success banner from the server result (owns i18n interpolation). */
  formatSuccess: (result: IngestResponse) => string;
  onIngested?: (result: IngestResponse) => void;
}

const SOURCES: DocumentInSourceEnum[] = ['local', 'web', 'other'];

/** Controlled ingest form: one document → POST /ingest, with success/error feedback. */
export function IngestForm({ labels, formatSuccess, onIngested }: IngestFormProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [source, setSource] = useState<DocumentInSourceEnum>('local');
  const [priority, setPriority] = useState(100);
  const ingest = useIngest((result) => onIngested?.(result));

  const sourceText: Record<DocumentInSourceEnum, string> = {
    local: labels.sourceLocal,
    web: labels.sourceWeb,
    other: labels.sourceOther,
  };

  const canSubmit = title.trim().length > 0 && text.trim().length > 0 && !ingest.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    ingest.mutate({
      documents: [{ title: title.trim(), text: text.trim(), source, priority }],
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>{labels.titleLabel}</span>
        <input
          className={styles.input}
          value={title}
          placeholder={labels.titlePlaceholder}
          onChange={(event) => setTitle(event.target.value)}
          disabled={ingest.isPending}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{labels.textLabel}</span>
        <textarea
          className={styles.textarea}
          value={text}
          placeholder={labels.textPlaceholder}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          disabled={ingest.isPending}
        />
      </label>

      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>{labels.sourceLabel}</span>
          <Select.Root
            value={source}
            onValueChange={(value) => setSource(value as DocumentInSourceEnum)}
          >
            <Select.Trigger className={styles.trigger} aria-label={labels.sourceLabel}>
              <Select.Value />
              <Select.Icon className={styles.selectIcon}>
                <ChevronDown size={15} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className={styles.content} position="popper" sideOffset={4}>
                <Select.Viewport className={styles.viewport}>
                  {SOURCES.map((value) => (
                    <Select.Item key={value} value={value} className={styles.item}>
                      <Select.ItemText>{sourceText[value]}</Select.ItemText>
                      <Select.ItemIndicator className={styles.indicator}>
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>{labels.priorityLabel}</span>
          <input
            className={styles.number}
            type="number"
            min={0}
            max={1000}
            value={priority}
            onChange={(event) => setPriority(Number(event.target.value))}
            disabled={ingest.isPending}
          />
        </label>

        <div className={styles.actions}>
          <Button variant="primary" size="sm" type="submit" disabled={!canSubmit}>
            {ingest.isPending ? <Spinner size={14} /> : <Upload size={14} />}
            {ingest.isPending ? labels.submitting : labels.submit}
          </Button>
        </div>
      </div>

      {ingest.isSuccess ? (
        <output className={styles.success} data-testid="ingest-success">
          {formatSuccess(ingest.data)}
        </output>
      ) : null}
      {ingest.isError ? (
        <p className={styles.error} role="alert" data-testid="ingest-error">
          {labels.error}
        </p>
      ) : null}
    </form>
  );
}
