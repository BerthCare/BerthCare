import { ApiError } from './api-error';
import { applyAuthHeader } from './interceptors';
import { buildUrl, createDefaultConfig } from './config';
import type { ApiClientConfig, ApiResponse, RequestOptions, TokenProvider, HttpMethod } from './types';

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

  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  async put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  async patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(method: HttpMethod, path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const baseUrl = options?.baseUrl ?? this.config.baseUrl;
    const url = buildUrl(baseUrl, path);
    const headers = await applyAuthHeader({ 'Content-Type': 'application/json', Accept: 'application/json', ...(options?.headers ?? {}) }, this.tokenProvider ?? undefined);

    // Placeholder fetch; real implementation will add timeout, retry, interceptors.
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: options?.signal,
    });

    const text = await response.text();
    const json = text ? (JSON.parse(text) as T) : (undefined as T);

    if (!response.ok) {
      throw new ApiError(response.status === 401 ? 'AuthenticationError' : response.status >= 500 ? 'ServerError' : 'ClientError', 'Request failed', {
        status: response.status,
        originalError: undefined,
      });
    }

    return {
      data: json,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }
}
