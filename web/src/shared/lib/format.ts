/** Human formatters for the units this console shows: latency, tokens, USD, percent. */

/** Format a latency in milliseconds, e.g. `840 ms` or `1.24 s`. */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Compact token counts, e.g. `512`, `12.3k`, `1.4M`. */
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined || Number.isNaN(tokens)) return '—';
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}

/**
 * Format a USD amount. Prices here are per-1k-token rates that can be tiny,
 * so we widen precision for sub-cent values.
 */
export function formatUsd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  if (amount === 0) return '$0.00';
  const fractionDigits = Math.abs(amount) < 0.01 ? 4 : 2;
  return `$${amount.toFixed(fractionDigits)}`;
}

/**
 * Format a percentage. Tolerates either a 0–100 percent value or a 0–1
 * fraction (values in `(0, 1]` are treated as fractions), matching the lenient
 * normalization the telemetry surfaces apply to open-object wire data.
 */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const pct = value > 0 && value <= 1 ? value * 100 : value;
  return `${pct.toFixed(pct > 0 && pct < 10 ? 1 : 0)}%`;
}
