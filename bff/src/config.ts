/**
 * Runtime configuration for the BFF.
 *
 * Every value has a localhost default so the console runs fully offline against
 * the three backends' "demo" mode. Keys default to "demo-key", the backends'
 * offline default bearer token. These platform keys are NEVER surfaced to the
 * browser — they only ever travel BFF -> backend.
 */

export interface ServiceConfig {
  /** Base origin of the upstream backend, e.g. http://localhost:8080 */
  readonly url: string;
  /** Bearer key injected on every proxied request to this backend. */
  readonly key: string;
}

export interface Config {
  readonly gateway: ServiceConfig;
  readonly rag: ServiceConfig;
  readonly orch: ServiceConfig;
  /** Port the node-server listens on. */
  readonly port: number;
  /** Per-client request budget per minute for the /api/* rate limiter. */
  readonly rateLimitPerMinute: number;
  /**
   * Request-body cap for all proxied /api/* traffic, in bytes. Slightly above
   * rag's 10 MiB MAX_REQUEST_BYTES so the BFF never rejects a legitimate
   * ingest the backend would accept — the backends stay authoritative.
   */
  readonly maxBodyBytes: number;
  /**
   * Where the live ROADMAP.md lives (raw markdown). The SPA bakes a copy in
   * at build time as an offline fallback; this URL keeps the deployed panel
   * in sync with main without an image rebuild. Empty string disables the
   * endpoint (it then 404s and the SPA stays on the baked copy).
   */
  readonly roadmapUrl: string;
}

type Env = Record<string, string | undefined>;

function str(env: Env, name: string, fallback: string): string {
  const v = env[name];
  return v !== undefined && v !== '' ? v : fallback;
}

function int(env: Env, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadConfig(env: Env = process.env): Config {
  return {
    gateway: {
      url: str(env, 'GATEWAY_URL', 'http://localhost:8080'),
      key: str(env, 'GATEWAY_KEY', 'demo-key'),
    },
    rag: {
      url: str(env, 'RAG_URL', 'http://localhost:8081'),
      key: str(env, 'RAG_KEY', 'demo-key'),
    },
    orch: {
      url: str(env, 'ORCH_URL', 'http://localhost:8083'),
      key: str(env, 'ORCH_KEY', 'demo-key'),
    },
    port: int(env, 'BFF_PORT', 8787),
    rateLimitPerMinute: int(env, 'BFF_RATE_LIMIT', 240),
    maxBodyBytes: int(env, 'BFF_MAX_BODY_BYTES', 12 * 1024 * 1024),
    // Deliberately not str(): an explicit ROADMAP_URL='' must disable, not
    // fall back to the default.
    roadmapUrl:
      env.ROADMAP_URL ??
      'https://raw.githubusercontent.com/INTERpol21/llm-platform-console/main/docs/ROADMAP.md',
  };
}

export const config: Config = loadConfig();
