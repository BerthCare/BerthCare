import type { NextFunction, Request, Response } from 'express';

type RateLimitKey = string;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyBuilder?: (req: Request) => string;
  store?: RateLimitStore;
  failOpen?: boolean;
};

const buckets: Map<RateLimitKey, RateLimitBucket> = new Map();
const CLEANUP_INTERVAL_MS = 60_000;

const pruneExpiredBuckets = (now: number): void => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

const cleanupInterval = setInterval(() => pruneExpiredBuckets(Date.now()), CLEANUP_INTERVAL_MS);
cleanupInterval.unref?.();

export const stopRateLimitCleanup = (): void => {
  clearInterval(cleanupInterval);
};

type RedisLike = {
  incr: (key: string) => Promise<number>;
  pExpire?: (key: string, ttl: number) => Promise<number | boolean>;
  expire?: (key: string, ttlSeconds: number) => Promise<number | boolean>;
  eval?: (script: string, keys: string[], args: string[]) => Promise<number>;
};

export type RateLimitStore = {
  increment: (key: string, windowMs: number) => Promise<number>;
};

const inMemoryStore: RateLimitStore = {
  increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return Promise.resolve(1);
    }

    bucket.count += 1;
    return Promise.resolve(bucket.count);
  },
};

export const createRedisStore = (client: RedisLike): RateLimitStore => ({
  async increment(key: string, windowMs: number): Promise<number> {
    if (client.eval) {
      // atomic: INCR + PEXPIRE in one script to avoid orphaned keys without TTL
      const script =
        'local current=redis.call("INCR", KEYS[1]); if current==1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]); end; return current;';
      const result = await client.eval(script, [key], [String(windowMs)]);
      return Number(result);
    }

    const count = await client.incr(key);
    if (count === 1) {
      // newly created key, set expiry
      if (client.pExpire) {
        await client.pExpire(key, windowMs);
      } else if (client.expire) {
        await client.expire(key, Math.ceil(windowMs / 1000));
      }
    }
    return count;
  },
});

const defaultKeyBuilder = (req: Request): string => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  return `${ip}:${email}:${deviceId}:${req.path}`;
};

export const rateLimit =
  (options: RateLimitOptions) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const store = options.store ?? inMemoryStore;
    const failOpen = options.failOpen ?? true;
    const key = options.keyBuilder ? options.keyBuilder(req) : defaultKeyBuilder(req);

    try {
      const count = await store.increment(key, options.windowMs);
      if (count > options.max) {
        res.status(429).json({ error: { message: 'Too many requests' } });
        return;
      }
      next();
    } catch (error) {
      // fail-open keeps availability; fail-closed can be opted into
      // Log for observability but don't block request
      console.error('Rate limiter error:', error);
      if (failOpen) {
        next();
      } else {
        res.status(503).json({ error: { message: 'Rate limiter unavailable' } });
      }
    }
  };
