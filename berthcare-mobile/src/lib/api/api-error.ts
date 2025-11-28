import type { ApiErrorType } from './types';

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status?: number;
  readonly originalError?: Error;
  readonly isRetryable: boolean;

  constructor(type: ApiErrorType, message: string, options?: { status?: number; originalError?: Error; isRetryable?: boolean }) {
    super(message);
    this.type = type;
    this.status = options?.status;
    this.originalError = options?.originalError;
    this.isRetryable = options?.isRetryable ?? false;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
