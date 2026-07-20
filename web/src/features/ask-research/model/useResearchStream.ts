import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResearchRun } from '../../../entities/research/index.ts';
import { applyEvent, initialRun, streamResearch } from '../../../entities/research/index.ts';

export interface StartOptions {
  maxIterations?: number;
  threadId?: string | null;
  model?: string | null;
}

export interface ResearchStreamController {
  run: ResearchRun;
  isStreaming: boolean;
  start: (question: string, options?: StartOptions) => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Drives one research run: owns the abort controller and folds the ordered
 * event stream into `ResearchRun`. A transport failure flips status to `error`
 * without throwing, so the UI never crashes mid-stream.
 */
export function useResearchStream(): ResearchStreamController {
  const [run, setRun] = useState<ResearchRun>(() => initialRun());
  const controllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    abort();
    setRun((prev) => (prev.status === 'streaming' ? { ...prev, status: 'done' } : prev));
  }, [abort]);

  const reset = useCallback(() => {
    abort();
    setRun(initialRun());
  }, [abort]);

  const start = useCallback(
    (question: string, options?: StartOptions) => {
      abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setRun({ ...initialRun(question), status: 'streaming' });

      void streamResearch({
        question,
        maxIterations: options?.maxIterations,
        threadId: options?.threadId ?? null,
        model: options?.model ?? null,
        signal: controller.signal,
        onEvent: (event) => setRun((prev) => applyEvent(prev, event)),
        onError: () =>
          setRun((prev) => (prev.status === 'error' ? prev : { ...prev, status: 'error' })),
      });
    },
    [abort],
  );

  useEffect(() => () => abort(), [abort]);

  return { run, isStreaming: run.status === 'streaming', start, stop, reset };
}
