import { ApiError } from './api-error';
import type { TokenProvider } from './types';

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
}

type PendingRetry<T> = {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  retry: () => Promise<T>;
};

const refreshState: {
  refreshing: Promise<string | null> | null;
  queue: PendingRetry<unknown>[];
} = {
  refreshing: null,
  queue: [],
};

// For test isolation only.
export function __resetRefreshState(): void {
  refreshState.refreshing = null;
  refreshState.queue = [];
}

function logRequest(context?: RequestContext, hasToken?: boolean): void {
  if (!context) {
    return;
  }

  const headerKeys = Object.keys(context.headers || {});
  const tokenState = hasToken ? 'token:yes' : 'token:no';
  // Debug-level request logging (no payloads or tokens).

  console.debug(
    `[api] ${context.method.toUpperCase()} ${context.url} headers=${headerKeys.join(',')} ${tokenState}`
  );
}

export async function applyAuthHeader(
  headers: Record<string, string>,
  tokenProvider?: TokenProvider,
  context?: RequestContext
): Promise<Record<string, string>> {
  if (!tokenProvider) {
    logRequest(context, false);
    return headers;
  }

  const token = await tokenProvider.getAccessToken();
  logRequest(context, Boolean(token));

  if (!token) {
    return headers;
  }

  // Preserve caller-provided headers; only inject Authorization if absent.
  if ('Authorization' in headers) {
    return headers;
  }

  return { ...headers, Authorization: `Bearer ${token}` };
}

async function refreshAccessToken(tokenProvider: TokenProvider): Promise<string | null> {
  refreshState.refreshing = tokenProvider.refreshToken();
  try {
    const newToken = await refreshState.refreshing;
    return newToken;
  } finally {
    refreshState.refreshing = null;
  }
}

function drainQueueWithError(error: ApiError): void {
  const pending = [...refreshState.queue];
  refreshState.queue = [];
  pending.forEach(({ reject }) => reject(error));
}

async function flushQueue(): Promise<void> {
  const pending = [...refreshState.queue];
  refreshState.queue = [];

  for (const item of pending) {
    try {
      const result = await item.retry();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }
}

export async function handle401Response<T>(
  tokenProvider: TokenProvider | null,
  retryFn: () => Promise<T>
): Promise<T> {
  if (!tokenProvider) {
    throw new ApiError('AuthenticationError', 'Unauthorized (no token provider)');
  }

  let tokensCleared = false;

  if (refreshState.refreshing) {
    return new Promise<T>((resolve, reject) => {
      refreshState.queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        retry: retryFn as () => Promise<unknown>,
      });
    });
  }

  try {
    const refreshed = await refreshAccessToken(tokenProvider);
    if (!refreshed) {
      await tokenProvider.clearTokens();
      tokensCleared = true;
      const error = new ApiError('AuthenticationError', 'Token refresh failed: missing token');
      drainQueueWithError(error);
      throw error;
    }

    const result = await retryFn();
    await flushQueue();
    return result;
  } catch (error) {
    if (!tokensCleared) {
      await tokenProvider.clearTokens();
      tokensCleared = true;
    }

    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError('AuthenticationError', 'Token refresh failed', {
            originalError: normalizedError,
          });

    drainQueueWithError(apiError);
    throw apiError;
  }
}
