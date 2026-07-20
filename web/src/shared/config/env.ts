/**
 * Single-origin access model: the SPA always talks to the BFF under `/api`.
 * Vite proxies `/api` to the local BFF in dev; Caddy fills that role in prod.
 */
export const API_BASE = '/api';

// All three backends now serve their API under a unified /v1 prefix, so every
// base carries it. The BFF strips only the /api/<svc> mount; /v1 travels upstream.
export const GATEWAY_BASE = `${API_BASE}/gateway/v1`;
export const ORCHESTRATOR_BASE = `${API_BASE}/orchestrator/v1`;
export const RAG_BASE = `${API_BASE}/rag/v1`;

export const THEME_STORAGE_KEY = 'console.theme';
export const LANG_STORAGE_KEY = 'console.lang';
export const TOKEN_STORAGE_KEY = 'console.token';
