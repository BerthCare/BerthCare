import * as Updates from 'expo-updates';
import type { ApiClientConfig, EnvironmentName, EnvironmentUrls, RetryConfig } from './types';

const DEFAULT_ENVIRONMENT_URLS: EnvironmentUrls = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.berthcare.ca/api',
  production: 'https://api.berthcare.ca/api',
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
};

const DEFAULT_TIMEOUT_MS = 30000;

function normalizeEnvironmentName(value?: string | null): EnvironmentName | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'development' || normalized === 'dev') {
    return 'development';
  }
  if (normalized === 'preview' || normalized === 'staging') {
    return 'staging';
  }
  if (normalized === 'production' || normalized === 'prod' || normalized === 'main') {
    return 'production';
  }
  return undefined;
}

function getUpdatesChannel(): string | undefined {
  try {
    const channel = Updates.channel;
    return channel ?? undefined;
  } catch {
    return undefined;
  }
}

function resolveEnvironment(envOverride?: string): EnvironmentName {
  return (
    normalizeEnvironmentName(envOverride) ??
    normalizeEnvironmentName(process.env.EXPO_PUBLIC_API_ENV) ??
    normalizeEnvironmentName(getUpdatesChannel()) ??
    (__DEV__ ? 'development' : 'production')
  );
}

export function getBaseUrl(options?: {
  baseUrlOverride?: string;
  envOverride?: string;
  environmentUrls?: Partial<EnvironmentUrls>;
}): string {
  const mergedEnvironments: EnvironmentUrls = {
    ...DEFAULT_ENVIRONMENT_URLS,
    ...(options?.environmentUrls ?? {}),
  };

  const explicitBaseUrl = options?.baseUrlOverride ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const environment = resolveEnvironment(options?.envOverride);
  return mergedEnvironments[environment];
}

export function createDefaultConfig(options?: {
  baseUrl?: string;
  envOverride?: string;
  environmentUrls?: Partial<EnvironmentUrls>;
  timeoutMs?: number;
  retry?: Partial<RetryConfig>;
}): ApiClientConfig {
  const baseUrlOptions = (() => {
    const config: {
      envOverride?: string;
      environmentUrls?: Partial<EnvironmentUrls>;
    } = {};
    if (options?.envOverride) {
      config.envOverride = options.envOverride;
    }
    if (options?.environmentUrls) {
      config.environmentUrls = options.environmentUrls;
    }
    return Object.keys(config).length > 0 ? config : undefined;
  })();

  const baseUrl = options?.baseUrl ?? getBaseUrl(baseUrlOptions);

  const retry: RetryConfig | undefined = options?.retry
    ? { ...DEFAULT_RETRY_CONFIG, ...options.retry }
    : { ...DEFAULT_RETRY_CONFIG };

  return {
    baseUrl,
    timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retry,
  };
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlashes(value: string): string {
  return value.replace(/^\/+/, '');
}

export function buildUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = trimTrailingSlashes(baseUrl);
  const normalizedPath = trimLeadingSlashes(path);

  if (!normalizedPath) {
    return normalizedBase;
  }

  return `${normalizedBase}/${normalizedPath}`;
}

export { DEFAULT_ENVIRONMENT_URLS, DEFAULT_RETRY_CONFIG, DEFAULT_TIMEOUT_MS };
export type { ApiClientConfig };
