/**
 * Authentication error types and error class for the Auth Service.
 */

/**
 * Types of authentication errors that can occur.
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
 */
export class AuthError extends Error {
  readonly type: AuthErrorType;
  readonly originalError: Error | undefined;

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
   */
  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }
}
