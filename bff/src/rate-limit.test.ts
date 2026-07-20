/**
 * RateLimiter unit tests with an injectable clock — deterministic, no timers.
 * Focus: the token-bucket decision and the idle-bucket eviction that keeps the
 * internal map from growing without bound.
 */

import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limit.ts';

/** A hand-cranked clock so time only advances when the test says so. */
function clock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

/** Reach into the private bucket map for a size assertion (test-only). */
function bucketCount(limiter: RateLimiter): number {
  return (limiter as unknown as { buckets: Map<string, unknown> }).buckets.size;
}

describe('RateLimiter decisions', () => {
  it('allows up to capacity then blocks with a Retry-After', () => {
    const c = clock();
    const limiter = new RateLimiter(2, c.now);
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(true);
    const blocked = limiter.check('a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('refills over time so a client recovers its budget', () => {
    const c = clock();
    const limiter = new RateLimiter(60, c.now); // 1 token/sec
    for (let i = 0; i < 60; i += 1) limiter.check('a');
    expect(limiter.check('a').allowed).toBe(false);
    c.advance(1000); // one second → one token
    expect(limiter.check('a').allowed).toBe(true);
  });
});

describe('RateLimiter eviction (bounded memory)', () => {
  it('drops idle buckets once past the refill window instead of growing forever', () => {
    const c = clock();
    const limiter = new RateLimiter(60, c.now);

    // A flood of one-off keys (e.g. spoofed x-forwarded-for) creates buckets.
    for (let i = 0; i < 100; i += 1) limiter.check(`ip-${i}`);
    expect(bucketCount(limiter)).toBe(100);

    // After the idle window, the next check sweeps the fully-refilled buckets.
    c.advance(60_001);
    limiter.check('fresh');
    expect(bucketCount(limiter)).toBe(1); // only the just-touched key survives
  });

  it('keeps a bucket that is still within its refill window', () => {
    const c = clock();
    const limiter = new RateLimiter(60, c.now);
    limiter.check('active');
    c.advance(30_000); // still inside the 60s window
    limiter.check('other');
    // The sweep hasn't run (interval not elapsed) and 'active' isn't idle enough.
    expect(bucketCount(limiter)).toBe(2);
  });
});
