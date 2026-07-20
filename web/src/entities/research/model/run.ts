import type { Evidence, ResearchStreamEvent } from './events.ts';

export type ResearchStatus = 'idle' | 'streaming' | 'done' | 'error';

/** Accumulated state of a single research run, built up from the event stream. */
export interface ResearchRun {
  status: ResearchStatus;
  question: string;
  trace: string[];
  evidence: Evidence[];
  answer: string;
  iterations: number;
  threadId: string | null;
  error: string | null;
}

export function initialRun(question = ''): ResearchRun {
  return {
    status: 'idle',
    question,
    trace: [],
    evidence: [],
    answer: '',
    iterations: 0,
    threadId: null,
    error: null,
  };
}

/** Pure reducer: fold one stream event into the run state. */
export function applyEvent(state: ResearchRun, event: ResearchStreamEvent): ResearchRun {
  switch (event.type) {
    case 'trace':
      return { ...state, status: 'streaming', trace: [...state.trace, event.step] };
    case 'evidence':
      return { ...state, status: 'streaming', evidence: [...state.evidence, event.evidence] };
    case 'token':
      return { ...state, status: 'streaming', answer: state.answer + event.text };
    case 'answer':
      return {
        ...state,
        status: 'done',
        answer: event.answer,
        iterations: event.iterations,
        threadId: event.threadId,
      };
    case 'error':
      return { ...state, status: 'error', error: event.message };
    default:
      return state;
  }
}
