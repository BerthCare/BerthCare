import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { config } from '../lib/config';
import { logger as rootLogger, createLogger } from '../observability/logger';

type RequestContext = {
  requestId: string;
  traceparent?: string;
  userId?: string;
  route?: string;
  startTime: bigint;
  logger: Logger;
};

const store = new AsyncLocalStorage<RequestContext>();

const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const normalizeRoute = (path?: string): string | undefined => {
  if (!path) return undefined;
  try {
    const url = new URL(path, 'http://localhost');
    return url.pathname;
  } catch {
    return path.split('?')[0];
  }
};

const resolveRequestId = (req: Request): string => {
  const headerId = getHeaderValue(req.header('x-request-id'));
  if (headerId) return headerId;

  const traceparent = getHeaderValue(req.header('traceparent'));
  if (traceparent) {
    const parts = traceparent.split('-');
    const traceId = parts[1];
    if (parts.length >= 3 && traceId && /^[a-f0-9]{32}$/i.test(traceId)) {
      return traceId;
    }
    return traceparent;
  }

  return randomUUID();
};

const millisSince = (start: bigint): number => {
  const diffNs = process.hrtime.bigint() - start;
  return Number(diffNs) / 1_000_000;
};

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = resolveRequestId(req);
  const traceparent = getHeaderValue(req.header('traceparent'));
  const route = normalizeRoute(req.originalUrl || req.url);
  res.setHeader('x-request-id', requestId);
  (req as Request & { requestId?: string }).requestId = requestId;

  if (!config.logEnableRequestLogs) {
    next();
    return;
  }

  const childLogger = createLogger({ requestId, traceparent, route, method: req.method });
  const startTime = process.hrtime.bigint();

  const context: RequestContext = { requestId, traceparent, route, startTime, logger: childLogger };

  const logRequest = (event: 'finish' | 'close'): void => {
    const durationMs = millisSince(startTime);
    const contentLengthHeader = res.getHeader('content-length');
    const contentLength = Array.isArray(contentLengthHeader)
      ? contentLengthHeader[0]
      : contentLengthHeader;

    childLogger.info(
      {
        event: 'http.request',
        requestId,
        traceparent,
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs,
        contentLength,
        userAgent: getHeaderValue(req.header('user-agent')),
        closedEarly: event === 'close' && res.writableEnded === false,
        userId: context.userId,
      },
      'HTTP request'
    );
  };

  store.run(context, () => {
    let logged = false;
    const logOnce = (event: 'finish' | 'close') => {
      if (logged) return;
      logged = true;
      logRequest(event);
    };

    res.once('finish', () => logOnce('finish'));
    res.once('close', () => logOnce('close'));
    next();
  });
};

export const getRequestContext = (): RequestContext | undefined => store.getStore();

export const getRequestLogger = (): Logger => {
  return store.getStore()?.logger ?? rootLogger;
};

export const setRequestUser = (userId: string): void => {
  const current = store.getStore();
  if (!current) return;
  current.userId = userId;
};
