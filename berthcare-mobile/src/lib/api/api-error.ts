import type { ApiErrorType } from './types';

export interface ErrorClassificationInput {
  status?: number;
  isTimeout?: boolean;
  isCancelled?: boolean;
  networkError?: boolean;
}

function isTypeRetryable(type: ApiErrorType): boolean {
  switch (type) {
    case 'NetworkError':
    case 'TimeoutError':
    case 'AuthenticationError':
    case 'ServerError':
      return true;
    case 'ClientError':
    case 'CancelledError':
    default:
      return false;
  }
}

export function resolveApiErrorType(input: ErrorClassificationInput): ApiErrorType {
  if (input.isCancelled) {
    return 'CancelledError';
  }
  if (input.isTimeout) {
    return 'TimeoutError';
  }
  if (input.status === 401) {
    return 'AuthenticationError';
  }
  if (typeof input.status === 'number') {
    if (input.status >= 500) {
      return 'ServerError';
    }
    if (input.status >= 400) {
      return 'ClientError';
    }
  }
  if (input.networkError) {
    return 'NetworkError';
  }
  return 'NetworkError';
}

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status: number | undefined;
  readonly originalError: Error | undefined;
  readonly isRetryable: boolean;

  constructor(
    type: ApiErrorType,
    message: string,
    options?: {
      status?: number;
      originalError?: Error;
      isRetryable?: boolean;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);

    this.type = type;
    this.status = options?.status ?? undefined;
    this.originalError = options?.originalError ?? undefined;
    this.isRetryable = options?.isRetryable ?? isTypeRetryable(type);
  }

  static from(
    message: string,
    input: ErrorClassificationInput & { originalError?: Error; isRetryable?: boolean }
  ): ApiError {
    const type = resolveApiErrorType(input);
    const options: { status?: number; originalError?: Error; isRetryable?: boolean } = {};
    if (input.status !== undefined) {
      options.status = input.status;
    }
    if (input.originalError !== undefined) {
      options.originalError = input.originalError;
    }
    if (input.isRetryable !== undefined) {
      options.isRetryable = input.isRetryable;
    }
    return new ApiError(type, message, options);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
