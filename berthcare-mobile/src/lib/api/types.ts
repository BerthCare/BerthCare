export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiErrorType =
  | 'NetworkError'
  | 'TimeoutError'
  | 'AuthenticationError'
  | 'ServerError'
  | 'ClientError'
  | 'CancelledError';

export type EnvironmentName = 'development' | 'staging' | 'production';

export interface EnvironmentUrls {
  development: string;
  staging: string;
  production: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  retry?: RetryConfig;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRetry?: boolean;
  baseUrl?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  clearTokens(): Promise<void>;
  getAuthState?(): {
    isAuthenticated: boolean;
    isOffline: boolean;
    requiresReauth: boolean;
  };
}

export interface ApiRequestHandle<T> {
  promise: Promise<T>;
  controller: AbortController;
  abort: () => void;
}
