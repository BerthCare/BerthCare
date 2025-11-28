import { ApiError, resolveApiErrorType } from './api-error';
import { applyAuthHeader, handle401Response } from './interceptors';
import { buildUrl, createDefaultConfig } from './config';
import { executeWithRetry } from './retry';
import type {
  ApiClientConfig,
  ApiRequestHandle,
  ApiResponse,
  RequestOptions,
  TokenProvider,
  HttpMethod,
} from './types';

export class ApiClient {
  private static instance: ApiClient | null = null;
  private config: ApiClientConfig;
  private tokenProvider: TokenProvider | null = null;

  private constructor(config: ApiClientConfig) {
    this.config = config;
  }

  static configure(config: ApiClientConfig): ApiClient {
    this.instance = new ApiClient(config);
    return this.instance;
  }

  static getInstance(): ApiClient {
    if (!this.instance) {
      this.instance = new ApiClient(createDefaultConfig());
    }
    return this.instance;
  }

  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  get<T>(path: string, options?: RequestOptions): ApiRequestHandle<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions,
  ): ApiRequestHandle<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  put<T>(path: string, data?: unknown, options?: RequestOptions): ApiRequestHandle<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  patch<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions,
  ): ApiRequestHandle<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }

  delete<T>(path: string, options?: RequestOptions): ApiRequestHandle<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private request<T>(
    method: HttpMethod,
    path: string,
    data?: unknown,
    options?: RequestOptions,
  ): ApiRequestHandle<ApiResponse<T>> {
    const controller = new AbortController();
    const promise = options?.skipRetry
      ? this.performRequest<T>(method, path, data, options, controller, true)
      : executeWithRetry(
          (attempt) =>
            this.performRequest<T>(method, path, data, { ...options, attempt }, controller, true),
          { method, retryConfig: this.config.retry! },
        );

    return {
      promise,
      controller,
      abort: () => controller.abort(new Error('Request aborted by caller')),
    };
  }

  private async performRequest<T>(
    method: HttpMethod,
    path: string,
    data?: unknown,
    options?: RequestOptions & { attempt?: number },
    controller?: AbortController,
    allow401Refresh = true,
  ): Promise<ApiResponse<T>> {
    const abortController = controller ?? new AbortController();
    const baseUrl = options?.baseUrl ?? this.config.baseUrl;
    const url = buildUrl(baseUrl, path);
    const baseHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    };
    const headers = options?.skipAuth
      ? baseHeaders
      : await applyAuthHeader(baseHeaders, this.tokenProvider ?? undefined, {
          url,
          method,
          headers: baseHeaders,
        });

    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs ?? 30000;
    const userSignal = options?.signal;
    const cleanup = linkAbortSignals(userSignal, abortController);
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      abortController.abort(new Error('Request timed out'));
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data != null ? JSON.stringify(data) : null,
        signal: abortController.signal,
      });

      if (response.status === 401 && allow401Refresh) {
        return handle401Response(this.tokenProvider, () =>
          this.performRequest(
            method,
            path,
            data,
            { ...options, attempt: (options?.attempt ?? 0) + 1 },
            abortController,
            false
          )
        );
      }

      const text = await response.text();
      const parsedBody = safeParseJson(text) as T;

      if (!response.ok) {
        const type = resolveApiErrorType({ status: response.status });
        throw new ApiError(type, 'Request failed', { status: response.status });
      }

      return {
        data: parsedBody,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (abortController.signal.aborted) {
        clearTimeout(timeoutId);
        cleanup();
        if (timedOut) {
          throw new ApiError('TimeoutError', 'Request timed out', { isRetryable: true });
        }
        throw new ApiError('CancelledError', 'Request was cancelled', { isRetryable: false });
      }

      if (ApiError.isApiError(error)) {
        clearTimeout(timeoutId);
        cleanup();
        throw error;
      }
      throw new ApiError(resolveApiErrorType({ networkError: true }), 'Network error', {
        originalError: error as Error,
      });
    } finally {
      clearTimeout(timeoutId);
      cleanup();
    }
  }
}

function safeParseJson<T>(value: string): T | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function linkAbortSignals(source: AbortSignal | undefined, target: AbortController): () => void {
  if (!source) {
    return () => {};
  }

  if (source.aborted) {
    target.abort(source.reason);
    return () => {};
  }

  const onAbort = () => target.abort(source.reason);
  source.addEventListener('abort', onAbort);

  return () => source.removeEventListener('abort', onAbort);
}
