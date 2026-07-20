import { fetchEventSource } from '@microsoft/fetch-event-source';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseResearchEvent } from '../entities/research/index.ts';
import type { ResearchStreamEvent } from '../entities/research/index.ts';
import { streamSse } from '../shared/api/index.ts';

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

const mockFes = vi.mocked(fetchEventSource);

interface RawFrame {
  event: string;
  data: string;
}

/** Drive the mocked transport through a fixed frame list, honouring abort. */
function driveFrames(frames: RawFrame[]) {
  mockFes.mockImplementation(async (_url, options) => {
    const opts = options as Parameters<typeof fetchEventSource>[1];
    await opts.onopen?.({ ok: true, status: 200, headers: new Headers() } as Response);
    for (const frame of frames) {
      if (opts.signal?.aborted) break;
      opts.onmessage?.({ id: '', event: frame.event, data: frame.data });
    }
    opts.onclose?.();
  });
}

beforeEach(() => {
  mockFes.mockReset();
});

describe('streamSse + parseResearchEvent', () => {
  it('parses trace events into typed events in the order received', async () => {
    // Catches: out-of-order or dropped trace steps, and malformed-frame crashes.
    driveFrames([
      { event: 'trace', data: JSON.stringify({ step: 'plan' }) },
      { event: 'ping', data: '' }, // heartbeat must be swallowed
      { event: 'trace', data: JSON.stringify({ step: 'search' }) },
      { event: 'trace', data: JSON.stringify({ step: 'synthesize' }) },
    ]);

    const received: ResearchStreamEvent[] = [];
    await streamSse({
      url: '/api/orchestrator/v1/research/stream',
      body: { question: 'q' },
      onMessage: (message) => {
        const event = parseResearchEvent(message);
        if (event) received.push(event);
      },
    });

    expect(received).toEqual([
      { type: 'trace', step: 'plan' },
      { type: 'trace', step: 'search' },
      { type: 'trace', step: 'synthesize' },
    ]);
  });

  it('stops forwarding messages once the caller aborts', async () => {
    // Catches: leaking events after abort (a live stream that ignores cancellation).
    const controller = new AbortController();
    const steps: string[] = [];

    driveFrames([
      { event: 'trace', data: JSON.stringify({ step: 'one' }) },
      { event: 'trace', data: JSON.stringify({ step: 'two' }) },
      { event: 'trace', data: JSON.stringify({ step: 'three' }) },
    ]);

    await streamSse({
      url: '/api/orchestrator/v1/research/stream',
      body: { question: 'q' },
      signal: controller.signal,
      onMessage: (message) => {
        const event = parseResearchEvent(message);
        if (event?.type === 'trace') {
          steps.push(event.step);
          if (steps.length === 2) controller.abort();
        }
      },
    });

    expect(steps).toEqual(['one', 'two']);
  });
});
