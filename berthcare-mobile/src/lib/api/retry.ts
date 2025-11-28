import type { ApiError } from './api-error';
import type { HttpMethod } from './types';

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
}

export function isIdempotentMethod(method: HttpMethod): boolean {
  return method === 'GET' || method === 'PUT' || method === 'DELETE';
}

export function calculateBackoffDelay(attempt: number, initialDelayMs: number, backoffMultiplier: number, maxDelayMs: number): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

export function shouldRetry(_error: ApiError, method: HttpMethod, _attempt: number): RetryDecision {
  return { shouldRetry: isIdempotentMethod(method), delayMs: 0 };
}
