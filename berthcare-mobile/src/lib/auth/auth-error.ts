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
 * | `NetworkError` | Network timeout/failure | Retry later, use offline mode |
 * | `TokenExpired` | Access/refresh token expired | Re-authenticate |
 * | `TokenRevoked` | Token was revoked server-side | Re-authenticate |
 * | `StorageError` | Secure storage read/write failed | Log error, attempt recovery |
 * | `OfflineGracePeriodExpired` | Offline > 7 days | Require network connection |
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
export type AuthErrorType =
  | 'InvalidCredentials'
  | 'NetworkError'
  | 'TokenExpired'
  | 'TokenRevoked'
  | 'StorageError'
  | 'OfflineGracePeriodExpired'
  | 'Unknown';

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
