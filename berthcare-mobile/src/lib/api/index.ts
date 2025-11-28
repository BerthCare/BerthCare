/**
 * Public API surface for the mobile API client.
 *
 * Usage:
 * ```ts
 * import { ApiClient, ApiError } from '@/lib/api';
 *
 * const client = ApiClient.getInstance();
 * const { promise } = client.get('/schedules');
 * ```
 */
export { ApiClient } from './api-client';
export { ApiError } from './api-error';
export type {
  ApiResponse,
  ApiClientConfig,
  RequestOptions,
  TokenProvider,
  ApiErrorType,
} from './types';
export { createDefaultConfig, getBaseUrl, buildUrl } from './config';
export { applyAuthHeader, handle401Response } from './interceptors';
export { executeWithRetry, shouldRetry, calculateBackoffDelay, isIdempotentMethod } from './retry';
