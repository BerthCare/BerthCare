import type { ApiClientConfig } from './types';

const defaultRetry = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
};

const defaults: ApiClientConfig = {
  baseUrl: 'https://api.berthcare.ca/api',
  timeoutMs: 30000,
  retry: defaultRetry,
};

export function createDefaultConfig(): ApiClientConfig {
  return { ...defaults, retry: { ...defaultRetry } };
}
