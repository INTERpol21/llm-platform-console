/**
 * Tiny in-memory token-bucket rate limiter, keyed per client.
 *
 * Deliberately dependency-free and process-local: the BFF is a single browser
 * entry point, so a per-instance bucket is enough to shield the backends from a
 * runaway tab. The clock is injectable so tests are deterministic.
 */

export interface RateDecision {
  readonly allowed: boolean;
  /** Whole seconds until at least one token is available (for Retry-After). */
  readonly retryAfterSeconds: number;
}

interface Bucket {
  tokens: number;
  last: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerMs: number;
  private readonly now: () => number;

  /**
   * @param perMinute sustained + burst budget per client per minute.
   * @param now injectable clock (defaults to Date.now) for deterministic tests.
   */
  constructor(perMinute: number, now: () => number = Date.now) {
    this.capacity = perMinute;
    this.refillPerMs = perMinute / 60_000;
    this.now = now;
  }

  check(key: string): RateDecision {
    const t = this.now();
    let bucket = this.buckets.get(key);
    if (bucket === undefined) {
      bucket = { tokens: this.capacity, last: t };
      this.buckets.set(key, bucket);
    } else {
      const elapsed = t - bucket.last;
      if (elapsed > 0) {
        bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
        bucket.last = t;
      }
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const deficit = 1 - bucket.tokens;
    const retryMs = deficit / this.refillPerMs;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
    };
  }
}
