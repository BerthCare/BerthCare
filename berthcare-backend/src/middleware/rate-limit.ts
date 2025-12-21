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
};

const buckets: Map<RateLimitKey, RateLimitBucket> = new Map();

const defaultKeyBuilder = (req: Request): string => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  return `${ip}:${email}:${deviceId}:${req.path}`;
};

export const rateLimit =
  (options: RateLimitOptions) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = options.keyBuilder ? options.keyBuilder(req) : defaultKeyBuilder(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (bucket.count >= options.max) {
      res.status(429).json({ error: { message: 'Too many requests' } });
      return;
    }

    bucket.count += 1;
    next();
  };
