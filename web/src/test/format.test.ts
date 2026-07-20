import { describe, expect, it } from 'vitest';
import { formatPct } from '../shared/lib/index.ts';

describe('formatPct', () => {
  it('treats the wire value as already percent-scale', () => {
    // context_used_pct is total_tokens / context_window * 100, so 6.25 -> 6.2%.
    expect(formatPct(6.25)).toBe('6.3%');
    expect(formatPct(45)).toBe('45%');
    expect(formatPct(100)).toBe('100%');
  });

  it('renders genuine sub-1% values as themselves, not multiplied by 100', () => {
    // Regression: the old fraction heuristic turned 0.5 (0.5%) into 50%.
    expect(formatPct(0.5)).toBe('0.5%');
    expect(formatPct(1)).toBe('1.0%');
  });

  it('shows a dash for missing values', () => {
    expect(formatPct(null)).toBe('—');
    expect(formatPct(undefined)).toBe('—');
    expect(formatPct(Number.NaN)).toBe('—');
  });
});
