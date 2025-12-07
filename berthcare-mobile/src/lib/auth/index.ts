/**
 * Auth Module - Secure token storage and authentication service.
 *
 * This module provides:
 * - Secure storage of JWT tokens using platform-native mechanisms
 *   (iOS Keychain, Android Keystore)
 * - Login/logout functionality
 * - Automatic token refresh on 401 responses
 * - Offline grace period support for rural connectivity
 * - TokenProvider interface for API client integration
 *
 * @example
 * ```typescript
 * import { AuthService, AuthError, AuthErrorType } from '@/lib/auth';
 *
 * // Configure the service (typically in app initialization)
 * AuthService.configure({
 *   apiClient,
 *   secureStorage,
 *   deviceId: 'unique-device-id',
 * });
 *
 * // Login
 * const result = await AuthService.getInstance().login(email, password);
 * if (!result.success) {
 *   console.error('Login failed:', result.error?.type);
 * }
 *
 * // Logout
 * await AuthService.getInstance().logout();
 * ```
 */

// Error types
export { AuthError, AuthErrorType } from './auth-error';

// Service
export { AuthService } from './auth-service';

// Secure storage
export { KeychainSecureStorage, secureStorage, STORAGE_KEYS } from './secure-storage';

// Types
export type {
  AuthServiceConfig,
  AuthState,
  LoginResult,
  TokenProvider,
  TokenPair,
  StoredTokenData,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  SecureStorageAdapter,
  ApiClientInterface,
} from './types';
