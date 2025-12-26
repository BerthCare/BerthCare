/**
 * Auth Module - Secure token storage and authentication service for BerthCare mobile.
 *
 * @module @/lib/auth
 *
 * This module provides a centralized authentication service with:
 * - Secure storage of JWT tokens using platform-native mechanisms
 *   (iOS Keychain, Android Keystore via react-native-keychain)
 * - Login/logout functionality with proper error handling
 * - Automatic token refresh on 401 responses
 * - Refresh queue mechanism for handling concurrent 401s
 * - Offline grace period support (7 days) for rural connectivity
 * - TokenProvider interface for API client integration
 * - Token persistence across app restarts
 *
 * ## Quick Start
 *
 * @example
 * ```typescript
 * import {
 *   AuthService,
 *   AuthError,
 *   AuthErrorType,
 *   secureStorage,
 * } from '@/lib/auth';
 * import type { AuthState, LoginResult } from '@/lib/auth';
 *
 * // 1. Configure the service (typically in app initialization)
 * AuthService.configure({
 *   apiClient,
 *   secureStorage,
 *   deviceId: 'unique-device-id',
 *   offlineGracePeriodDays: 7, // optional, defaults to 7
 * });
 *
 * // 2. Check if user is already authenticated (on app startup)
 * const isLoggedIn = await AuthService.getInstance().isAuthenticated();
 *
 * // 3. Login
 * const result: LoginResult = await AuthService.getInstance().login(email, password);
 * if (result.success) {
 *   console.log('Logged in successfully');
 * } else {
 *   // Handle error based on type
 *   switch (result.error?.type) {
 *     case 'InvalidCredentials':
 *       console.error('Invalid email or password');
 *       break;
 *     case 'NetworkError':
 *       console.error('Network error, please try again');
 *       break;
 *     default:
 *       console.error('Login failed:', result.error?.message);
 *   }
 * }
 *
 * // 4. Get access token for API requests (auto-refreshes if expired)
 * const token = await AuthService.getInstance().getAccessToken();
 *
 * // 5. Logout
 * await AuthService.getInstance().logout();
 * ```
 *
 * ## Error Handling
 *
 * The module uses `AuthError` for all authentication-related errors:
 *
 * @example
 * ```typescript
 * import { AuthError, AuthErrorType } from '@/lib/auth';
 *
 * try {
 *   const token = await authService.getAccessToken();
 * } catch (error) {
 *   if (AuthError.isAuthError(error)) {
 *     switch (error.type) {
 *       case 'TokenExpired':
 *         // Token expired and refresh failed
 *         break;
 *       case 'NetworkError':
 *         // Network issue, may work offline
 *         break;
 *       case 'StorageError':
 *         // Secure storage issue
 *         break;
 *       case 'OfflineGracePeriodExpired':
 *         // Been offline too long, need to reconnect
 *         break;
 *     }
 *   }
 * }
 * ```
 *
 * ## Offline Support
 *
 * The auth service supports offline operation with a configurable grace period:
 *
 * @example
 * ```typescript
 * // Check if user can continue offline
 * const { canContinue, reason } = await authService.checkOfflineAccess();
 * if (!canContinue) {
 *   if (reason === 'OfflineGracePeriodExpired') {
 *     // Show "connect to network" message
 *   }
 * }
 *
 * // Get token for offline use (doesn't attempt refresh)
 * const offlineToken = await authService.getOfflineAccessToken();
 * ```
 *
 * @packageDocumentation
 */

// ============================================
// Error Types
// ============================================

export { AuthError, AuthErrorType } from './auth-error';
export { AuthService } from './auth';

// ============================================
// Secure Storage
// ============================================

export { KeychainSecureStorage, secureStorage, STORAGE_KEYS } from './secure-storage';
export type { StorageKey } from './secure-storage';

// ============================================
// Types
// ============================================

export type {
  // Configuration
  AuthServiceConfig,
  ApiClientInterface,
  SecureStorageAdapter,

  // State
  AuthState,
  LoginResult,

  // Token Provider Interface
  TokenProvider,

  // Token Data
  TokenPair,
  StoredTokenData,

  // API Request/Response
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,

  // Internal (exported for advanced use cases)
  PendingRefreshRequest,
  RefreshQueueState,
} from './types';
