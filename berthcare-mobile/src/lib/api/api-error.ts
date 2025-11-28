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
  readonly status?: number;
  readonly originalError?: Error;
  readonly isRetryable: boolean;

  constructor(
    type: ApiErrorType,
    message: string,
    options?: {
      status?: number;
      originalError?: Error;
      isRetryable?: boolean;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);

    this.type = type;
    this.status = options?.status;
    this.originalError = options?.originalError;
    this.isRetryable = options?.isRetryable ?? isTypeRetryable(type);
  }

  static from(message: string, input: ErrorClassificationInput & { originalError?: Error; isRetryable?: boolean }): ApiError {
    const type = resolveApiErrorType(input);
    return new ApiError(type, message, {
      status: input.status,
      originalError: input.originalError,
      isRetryable: input.isRetryable,
    });
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
