import type { NextFunction, Request, Response } from 'express';
import { getRequestContext, getRequestLogger } from './logging';

type ErrorWithStatus = Error & { status?: number; statusCode?: number };

const getStatusCode = (error: ErrorWithStatus): number => {
  const fromError = error.status ?? error.statusCode;
  if (typeof fromError === 'number' && fromError >= 400 && fromError < 600) {
    return fromError;
  }
  return 500;
};

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  if (res.headersSent) {
    return;
  }
  const statusCode = getStatusCode(err);
  const { requestId } = getRequestContext() ?? {};
  const log = getRequestLogger();

  log.error(
    {
      event: 'http.error',
      requestId,
      method: req.method,
      route: req.originalUrl ?? req.url,
      statusCode,
      message: err.message,
      stack: err.stack,
    },
    'Unhandled error'
  );

  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? 'Internal Server Error' : err.message,
      requestId,
    },
  });
};
