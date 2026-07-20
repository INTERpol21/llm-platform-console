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
  /** Idle window after which a bucket has fully refilled and can be dropped. */
  private readonly idleMs: number;
  private lastSweep: number;

  /**
   * @param perMinute sustained + burst budget per client per minute.
   * @param now injectable clock (defaults to Date.now) for deterministic tests.
   */
  constructor(perMinute: number, now: () => number = Date.now) {
    this.capacity = perMinute;
    this.refillPerMs = perMinute / 60_000;
    this.now = now;
    // Time to refill an empty bucket to full: once idle this long a bucket is
    // indistinguishable from a fresh one, so evicting it is behaviour-preserving.
    this.idleMs = 60_000;
    this.lastSweep = now();
  }

  check(key: string): RateDecision {
    const t = this.now();
    this.sweep(t);
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

  /**
   * Drop fully-refilled idle buckets so the map can't grow without bound (e.g.
   * from a client varying `x-forwarded-for` per request). Runs at most once per
   * idle window; a dropped bucket would compute back to a fresh full bucket, so
   * eviction never changes a decision.
   */
  private sweep(t: number): void {
    if (t - this.lastSweep < this.idleMs) return;
    this.lastSweep = t;
    for (const [key, bucket] of this.buckets) {
      if (t - bucket.last >= this.idleMs) this.buckets.delete(key);
    }
  }
}
