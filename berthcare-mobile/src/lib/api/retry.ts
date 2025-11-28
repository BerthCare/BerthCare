import { ApiError } from './api-error';
import type { HttpMethod, RetryConfig } from './types';

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
}

export interface ExecuteWithRetryOptions {
  method: HttpMethod;
  retryConfig: RetryConfig;
}

export function isIdempotentMethod(method: HttpMethod): boolean {
  return method === 'GET' || method === 'PUT' || method === 'DELETE';
}

export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, Math.max(0, attempt - 1));
  return Math.min(delay, config.maxDelayMs);
}

export function shouldRetry(error: ApiError, method: HttpMethod, attempt: number, config: RetryConfig): RetryDecision {
  if (attempt > config.maxRetries) {
    return { shouldRetry: false, delayMs: 0 };
  }

  if (!error.isRetryable) {
    return { shouldRetry: false, delayMs: 0 };
  }

  if (!isIdempotentMethod(method)) {
    return { shouldRetry: false, delayMs: 0 };
  }

  const delayMs = calculateBackoffDelay(attempt, config);
  return { shouldRetry: true, delayMs };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRetry<T>(fn: (attempt: number) => Promise<T>, options: ExecuteWithRetryOptions): Promise<T> {
  let attempt = 0;
  const { method, retryConfig } = options;

  while (true) {
    attempt += 1;
    try {
      return await fn(attempt);
    } catch (error) {
      if (!ApiError.isApiError(error)) {
        throw error;
      }

      const decision = shouldRetry(error, method, attempt, retryConfig);
      if (!decision.shouldRetry) {
        throw error;
      }

      await wait(decision.delayMs);
    }
  }
}
