/**
 * Authentication error types and error class for the Auth Service.
 *
 * @module @/lib/auth/auth-error
 */

/**
 * Types of authentication errors that can occur.
 *
 * | Error Type | Description | Recovery Action |
 * |------------|-------------|-----------------|
 * | `InvalidCredentials` | Wrong email/password | Show error, let user retry |
 * | `InvalidRequest` | Missing/invalid request payload | Ask user to retry or update inputs |
 * | `RateLimited` | Too many auth attempts | Back off and retry later |
 * | `NetworkError` | Network timeout/failure | Retry later, use offline mode |
 * | `TokenExpired` | Access/refresh token expired | Re-authenticate |
 * | `TokenRevoked` | Token was revoked server-side | Re-authenticate |
 * | `StorageError` | Secure storage read/write failed | Log error, attempt recovery |
 * | `OfflineGracePeriodExpired` | Offline > 7 days | Require network connection |
 * | `ServerError` | Auth service failure | Retry later or report issue |
 * | `InvalidResponse` | Auth response missing expected fields | Treat as auth failure |
 * | `Unknown` | Unexpected error | Log and report |
 *
 * @example
 * ```typescript
 * import { AuthErrorType } from '@/lib/auth';
 *
 * function handleAuthError(type: AuthErrorType) {
 *   switch (type) {
 *     case 'InvalidCredentials':
 *       showToast('Invalid email or password');
 *       break;
 *     case 'NetworkError':
 *       showToast('Network error, please try again');
 *       break;
 *     case 'TokenExpired':
 *     case 'TokenRevoked':
 *       navigateToLogin();
 *       break;
 *     case 'OfflineGracePeriodExpired':
 *       showToast('Please connect to the internet');
 *       break;
 *   }
 * }
 * ```
 */
export const AUTH_ERROR_TYPES = [
  'InvalidCredentials',
  'InvalidRequest',
  'RateLimited',
  'NetworkError',
  'TokenExpired',
  'TokenRevoked',
  'StorageError',
  'OfflineGracePeriodExpired',
  'ServerError',
  'InvalidResponse',
  'Unknown',
] as const;

export type AuthErrorType = (typeof AUTH_ERROR_TYPES)[number];

export const isAuthErrorType = (value: unknown): value is AuthErrorType =>
  typeof value === 'string' && (AUTH_ERROR_TYPES as readonly string[]).includes(value);

export interface AuthErrorResponse {
  error: {
    message: string;
    requestId?: string;
    code?: string;
  };
}

const isAuthErrorDetails = (value: unknown): value is AuthErrorResponse['error'] => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const details = value as { message?: unknown; requestId?: unknown; code?: unknown };
  return (
    typeof details.message === 'string' &&
    (details.requestId == null || typeof details.requestId === 'string') &&
    (details.code == null || typeof details.code === 'string')
  );
};

export const isAuthErrorResponse = (value: unknown): value is AuthErrorResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as { error?: unknown };
  return isAuthErrorDetails(payload.error);
};

export const extractAuthErrorMessage = (value: unknown): string | undefined => {
  if (!isAuthErrorResponse(value)) {
    return undefined;
  }

  return value.error.message;
};

/**
 * Custom error class for authentication-related errors.
 *
 * Extends the standard Error class with additional properties for
 * error classification and debugging.
 *
 * @example
 * ```typescript
 * import { AuthError } from '@/lib/auth';
 *
 * // Creating an error
 * const error = new AuthError(
 *   'NetworkError',
 *   'Failed to connect to server',
 *   originalError
 * );
 *
 * // Checking error type
 * if (AuthError.isAuthError(error)) {
 *   console.log('Auth error type:', error.type);
 *   console.log('Original error:', error.originalError);
 * }
 *
 * // In catch blocks
 * try {
 *   await authService.login(email, password);
 * } catch (error) {
 *   if (AuthError.isAuthError(error)) {
 *     handleAuthError(error.type);
 *   }
 * }
 * ```
 */
export class AuthError extends Error {
  /** The type of authentication error */
  readonly type: AuthErrorType;
  /** The original error that caused this auth error (if any) */
  readonly originalError: Error | undefined;

  /**
   * Create a new AuthError.
   *
   * @param type - The type of authentication error
   * @param message - Human-readable error message
   * @param originalError - The original error that caused this (optional)
   */
  constructor(type: AuthErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.originalError = originalError;

    // Restore prototype chain for proper instanceof checks in transpiled code
    Object.setPrototypeOf(this, AuthError.prototype);

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Type guard to check if an unknown error is an AuthError.
   *
   * @param error - The error to check
   * @returns true if the error is an AuthError instance
   *
   * @example
   * ```typescript
   * try {
   *   await someAuthOperation();
   * } catch (error) {
   *   if (AuthError.isAuthError(error)) {
   *     // TypeScript now knows error is AuthError
   *     console.log(error.type);
   *   }
   * }
   * ```
   */
  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }
}
