import { fetchEventSource } from '@microsoft/fetch-event-source';
import { TOKEN_STORAGE_KEY } from '../config/index.ts';

/** One decoded server-sent message (before domain parsing). */
export interface SseMessage {
  event: string;
  data: string;
  id?: string;
}

export interface StreamSseOptions {
  url: string;
  body?: unknown;
  method?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  onOpen?: () => void;
  onMessage: (message: SseMessage) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
}

/** Names the server uses for keep-alive frames; these carry no domain payload. */
const HEARTBEAT_EVENTS = new Set(['ping', 'heartbeat', 'keep-alive']);

/** Thrown internally to stop fetch-event-source from auto-retrying on a fatal error. */
class FatalStreamError extends Error {}

function authHeaders(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * POST + SSE helper wrapping fetch-event-source.
 *
 * Contract that the tests pin down:
 *  - heartbeat frames and empty data are swallowed (never forwarded);
 *  - once the caller's `signal` aborts, no further messages are forwarded;
 *  - a fatal transport/HTTP error is reported once and does NOT trigger a retry loop;
 *  - a caller-initiated abort resolves quietly (it is not an error).
 */
export async function streamSse(options: StreamSseOptions): Promise<void> {
  const {
    url,
    body,
    method = 'POST',
    signal,
    headers,
    onOpen,
    onMessage,
    onError,
    onClose,
  } = options;

  try {
    await fetchEventSource(url, {
      method,
      signal,
      openWhenHidden: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...authHeaders(),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      async onopen(response) {
        if (response.ok) {
          onOpen?.();
          return;
        }
        throw new FatalStreamError(`Stream open failed with ${response.status}`);
      },
      onmessage(message) {
        // Stop forwarding the moment the caller aborts.
        if (signal?.aborted) return;
        if (HEARTBEAT_EVENTS.has(message.event)) return;
        if (message.data === '') return;
        onMessage({
          event: message.event || 'message',
          data: message.data,
          id: message.id || undefined,
        });
      },
      onerror(error) {
        // Returning would let the library retry; rethrow to make it fatal.
        onError?.(error);
        throw error instanceof FatalStreamError ? error : new FatalStreamError(String(error));
      },
      onclose() {
        onClose?.();
      },
    });
  } catch (error) {
    // A caller-initiated abort is a normal end-of-stream, not a failure.
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      onClose?.();
      return;
    }
    if (error instanceof FatalStreamError) {
      // onError was already invoked in onerror/onopen paths.
      onClose?.();
      return;
    }
    onError?.(error);
    onClose?.();
  }
}
