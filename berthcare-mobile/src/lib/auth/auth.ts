/**
 * AuthService - Centralized authentication service for the BerthCare mobile app.
 *
 * @module @/lib/auth/auth
 *
 * This service manages user authentication state, token storage, and automatic token refresh.
 * It implements the TokenProvider interface for seamless API client integration.
 *
 * ## Features
 *
 * - **Secure Token Storage**: Uses platform-native secure storage (iOS Keychain, Android Keystore)
 * - **Automatic Token Refresh**: Transparently refreshes expired tokens on API calls
 * - **Concurrent 401 Handling**: Queues multiple 401 responses to make a single refresh request
 * - **Offline Support**: 7-day grace period for offline operation in rural areas
 * - **Token Persistence**: Tokens survive app restarts while remaining encrypted
 *
 * ## Error Handling Patterns
 *
 * The service uses `AuthError` for all authentication-related errors. Here's how to handle them:
 *
 * @example
 * ```typescript
 * // Login error handling
 * const result = await authService.login(email, password);
 * if (!result.success) {
 *   switch (result.error?.type) {
 *     case 'InvalidCredentials':
 *       // Show "Invalid email or password" message
 *       break;
 *     case 'NetworkError':
 *       // Show "Network error, please try again" message
 *       // Existing tokens are preserved
 *       break;
 *     default:
 *       // Log unexpected error
 *       console.error('Login failed:', result.error);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Token refresh error handling
 * const token = await authService.getAccessToken();
 * if (!token) {
 *   const state = authService.getAuthState();
 *   if (state.requiresReauth) {
 *     // Navigate to login screen
 *   } else if (state.isOffline) {
 *     // Show offline indicator, use cached data
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Offline access handling
 * const { canContinue, reason } = await authService.checkOfflineAccess();
 * if (!canContinue) {
 *   switch (reason) {
 *     case 'OfflineGracePeriodExpired':
 *       // Show "Please connect to the internet" message
 *       break;
 *     case 'NoTokens':
 *       // Navigate to login screen
 *       break;
 *   }
 * }
 * ```
 */

import { assertAuthServiceConfig, normalizeLoginResponse, normalizeRefreshResponse } from './types';
import type {
  AuthServiceConfig,
  AuthState,
  LoginResult,
  LoginResponse,
  RefreshResponse,
  TokenProvider,
  PendingRefreshRequest,
} from './types';
import { AuthError } from './auth-error';
import { STORAGE_KEYS } from './secure-storage';

/**
 * Default offline grace period in days.
 */
const DEFAULT_OFFLINE_GRACE_PERIOD_DAYS = 7;

/**
 * Buffer window before token expiry to account for clock skew.
 */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

const isTokenExpired = (expiresAt: number, now: number): boolean => {
  if (!Number.isFinite(expiresAt)) {
    return true;
  }
  return now + TOKEN_EXPIRY_BUFFER_MS >= expiresAt;
};

/**
 * AuthService singleton class.
 *
 * Provides:
 * - Secure token storage using platform-native mechanisms
 * - Login/logout functionality
 * - Automatic token refresh on expiry
 * - Offline grace period support
 * - TokenProvider interface for API client integration
 */
export class AuthService implements TokenProvider {
  private static instance: AuthService | null = null;
  private config: AuthServiceConfig | null = null;
  private authState: AuthState = {
    isAuthenticated: false,
    isOffline: false,
    requiresReauth: false,
  };

  // Refresh queue state for handling concurrent 401s
  private isRefreshing = false;
  private pendingRefreshRequests: PendingRefreshRequest[] = [];
  private refreshCallCount = 0; // Track refresh calls for testing

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of AuthService.
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Configure the AuthService with required dependencies.
   * Must be called before using any other methods.
   *
   * Automatically wires the AuthService as the TokenProvider for the API client,
   * enabling automatic token injection and 401 response handling.
   *
   * @param config - Configuration options including apiClient, secureStorage, and deviceId
   *
   * @example
   * ```typescript
   * AuthService.configure({
   *   apiClient,
   *   secureStorage,
   *   deviceId: 'unique-device-id',
   *   offlineGracePeriodDays: 7, // optional, defaults to 7
   * });
   * ```
   */
  static configure(config: AuthServiceConfig): void {
    assertAuthServiceConfig(config);

    const instance = AuthService.getInstance();
    instance.config = {
      ...config,
      offlineGracePeriodDays: config.offlineGracePeriodDays ?? DEFAULT_OFFLINE_GRACE_PERIOD_DAYS,
    };

    // Wire AuthService as TokenProvider for the API client
    // This enables automatic token injection and 401 response handling
    if (config.apiClient.setTokenProvider) {
      config.apiClient.setTokenProvider(instance);
    }
  }

  /**
   * Reset the singleton instance (primarily for testing).
   */
  static resetInstance(): void {
    if (AuthService.instance) {
      const instance = AuthService.instance;
      const pending = [...instance.pendingRefreshRequests];
      instance.pendingRefreshRequests = [];
      pending.forEach((request) =>
        request.reject(new AuthError('Unknown', 'Auth reset while refresh pending'))
      );
      instance.isRefreshing = false;
      instance.refreshCallCount = 0;
      instance.config = null;
      instance.authState = {
        isAuthenticated: false,
        isOffline: false,
        requiresReauth: false,
      };
    }
    AuthService.instance = null;
  }

  /**
   * Get the number of refresh calls made.
   * @internal Test-only helper to assert refresh behaviors.
   */
  getRefreshCallCount(): number {
    return this.refreshCallCount;
  }

  /**
   * Reset the refresh call count.
   * @internal Test-only helper to reset call counters between tests.
   */
  resetRefreshCallCount(): void {
    this.refreshCallCount = 0;
  }

  /**
   * Get the current authentication state.
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get the current configuration (for internal use and testing).
   */
  getConfig(): AuthServiceConfig | null {
    return this.config;
  }

  /**
   * Ensure the service is configured before use.
   * @throws AuthError if not configured
   */
  private ensureConfigured(): AuthServiceConfig {
    if (!this.config) {
      throw new AuthError(
        'Unknown',
        'AuthService not configured. Call AuthService.configure() first.'
      );
    }
    return this.config;
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Authenticate user with email and password.
   * Sends credentials to backend and stores tokens on success.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns LoginResult indicating success or failure
   *
   * @example
   * ```typescript
   * const result = await authService.login('user@example.com', 'password');
   * if (result.success) {
   *   console.log('Logged in successfully');
   * } else {
   *   console.error('Login failed:', result.error?.type);
   * }
   * ```
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const config = this.ensureConfigured();

    try {
      // Send login request to backend
      const response = await config.apiClient.post<LoginResponse>('/api/auth/login', {
        email,
        password,
        deviceId: config.deviceId,
      });

      const now = Date.now();
      let normalizedResponse: ReturnType<typeof normalizeLoginResponse>;

      try {
        normalizedResponse = normalizeLoginResponse(response, now);
      } catch (validationError) {
        return {
          success: false,
          error: new AuthError(
            'InvalidResponse',
            'Login response missing required fields',
            validationError instanceof Error ? validationError : undefined
          ),
        };
      }

      // Store tokens in secure storage
      await Promise.all([
        config.secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, normalizedResponse.accessToken),
        config.secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, normalizedResponse.refreshToken),
        config.secureStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
          normalizedResponse.accessTokenExpiresAt.toString()
        ),
        config.secureStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
          normalizedResponse.refreshTokenExpiresAt.toString()
        ),
        config.secureStorage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, now.toString()),
      ]);

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        isOffline: false,
        requiresReauth: false,
      };

      return { success: true };
    } catch (error) {
      // Determine error type and return appropriate AuthError
      if (this.isNetworkError(error)) {
        // Network error - preserve existing tokens
        return {
          success: false,
          error: new AuthError(
            'NetworkError',
            'Network error during login',
            error instanceof Error ? error : undefined
          ),
        };
      }

      if (this.isInvalidCredentialsError(error)) {
        // Invalid credentials - don't store any tokens
        return {
          success: false,
          error: new AuthError('InvalidCredentials', 'Invalid email or password'),
        };
      }

      // Unknown error
      return {
        success: false,
        error: new AuthError(
          'Unknown',
          'An unexpected error occurred during login',
          error instanceof Error ? error : undefined
        ),
      };
    }
  }

  /**
   * Log out the current user and clear all tokens.
   * Removes all authentication data from secure storage and resets state.
   *
   * @example
   * ```typescript
   * await authService.logout();
   * // User is now logged out, requiresReauth is true
   * ```
   */
  async logout(): Promise<void> {
    const config = this.ensureConfigured();

    // Remove all tokens from secure storage
    await Promise.all([
      config.secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      config.secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      config.secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY),
      config.secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY),
      config.secureStorage.removeItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP),
    ]);

    // Clear in-memory auth state
    this.authState = {
      isAuthenticated: false,
      isOffline: false,
      requiresReauth: true,
    };

    // Clear any pending refresh state
    this.rejectPendingRequests(new AuthError('Unknown', 'User logged out'));
    this.isRefreshing = false;
  }

  /**
   * Check if the user is currently authenticated.
   * Checks secure storage for valid tokens and restores auth state.
   *
   * @returns true if user has valid tokens, false otherwise
   *
   * @example
   * ```typescript
   * const isLoggedIn = await authService.isAuthenticated();
   * if (isLoggedIn) {
   *   // User is authenticated, proceed to main app
   * } else {
   *   // User needs to log in
   * }
   * ```
   */
  async isAuthenticated(): Promise<boolean> {
    const config = this.ensureConfigured();

    // Check for access token in secure storage
    const accessToken = await config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await config.secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    // No tokens at all - unauthenticated
    if (!accessToken && !refreshToken) {
      this.authState = {
        isAuthenticated: false,
        isOffline: false,
        requiresReauth: false,
      };
      return false;
    }

    // Check access token expiry
    const accessExpiryStr = await config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
    const refreshExpiryStr = await config.secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);

    const now = Date.now();
    const accessExpiry = accessExpiryStr ? Number(accessExpiryStr) : 0;
    const refreshExpiry = refreshExpiryStr ? Number(refreshExpiryStr) : 0;

    // If access token is valid (not expired), user is authenticated
    if (accessToken && !isTokenExpired(accessExpiry, now)) {
      this.authState = {
        isAuthenticated: true,
        isOffline: false,
        requiresReauth: false,
      };
      return true;
    }

    // Access token expired, check if refresh token is valid
    if (refreshToken && !isTokenExpired(refreshExpiry, now)) {
      // Refresh token is valid - user is authenticated but may need refresh on first API call
      this.authState = {
        isAuthenticated: true,
        isOffline: false,
        requiresReauth: false,
      };
      return true;
    }

    // Both tokens expired - requires re-authentication
    this.authState = {
      isAuthenticated: false,
      isOffline: false,
      requiresReauth: true,
    };
    return false;
  }

  /**
   * Restore authentication state from secure storage.
   * Called on app startup to restore the previous session.
   *
   * @returns The restored auth state
   *
   * @example
   * ```typescript
   * const state = await authService.restoreAuthState();
   * if (state.isAuthenticated) {
   *   // Navigate to main app
   * } else if (state.requiresReauth) {
   *   // Navigate to login screen
   * }
   * ```
   */
  async restoreAuthState(): Promise<AuthState> {
    await this.isAuthenticated();
    return this.getAuthState();
  }

  // ============================================
  // Offline Grace Period Support
  // ============================================

  /**
   * Update the last online timestamp.
   * Should be called when the device successfully communicates with the backend.
   *
   * @example
   * ```typescript
   * // After successful API call
   * await authService.updateLastOnlineTimestamp();
   * ```
   */
  async updateLastOnlineTimestamp(): Promise<void> {
    const config = this.ensureConfigured();
    const now = Date.now();
    await config.secureStorage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, now.toString());
    this.authState = {
      ...this.authState,
      isOffline: false,
    };
  }

  /**
   * Check if the device is within the offline grace period.
   * The grace period allows continued use of cached tokens when offline.
   *
   * @returns true if within grace period, false if grace period has expired
   *
   * @example
   * ```typescript
   * const canUseOffline = await authService.isWithinOfflineGracePeriod();
   * if (!canUseOffline) {
   *   // Show "network required" message
   * }
   * ```
   */
  async isWithinOfflineGracePeriod(): Promise<boolean> {
    const config = this.ensureConfigured();

    const lastOnlineStr = await config.secureStorage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP);

    // If no last online timestamp, we can't determine grace period
    // This could happen if the user has never been online
    if (!lastOnlineStr) {
      return false;
    }

    const lastOnline = Number(lastOnlineStr);
    const now = Date.now();
    const gracePeriodMs =
      (config.offlineGracePeriodDays ?? DEFAULT_OFFLINE_GRACE_PERIOD_DAYS) * 24 * 60 * 60 * 1000;

    return now - lastOnline < gracePeriodMs;
  }

  /**
   * Check if the user can continue using the app while offline.
   * Validates both token presence and offline grace period.
   *
   * @returns Object with canContinue flag and reason if not
   *
   * @example
   * ```typescript
   * const { canContinue, reason } = await authService.checkOfflineAccess();
   * if (!canContinue) {
   *   if (reason === 'OfflineGracePeriodExpired') {
   *     // Show "connect to network" message
   *   } else if (reason === 'NoTokens') {
   *     // Navigate to login
   *   }
   * }
   * ```
   */
  async checkOfflineAccess(): Promise<{
    canContinue: boolean;
    reason?: 'OfflineGracePeriodExpired' | 'NoTokens' | 'TokensExpired';
  }> {
    const config = this.ensureConfigured();

    // Check for tokens
    const accessToken = await config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await config.secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!accessToken && !refreshToken) {
      return { canContinue: false, reason: 'NoTokens' };
    }

    // Check if within offline grace period
    const withinGracePeriod = await this.isWithinOfflineGracePeriod();

    if (!withinGracePeriod) {
      // Grace period expired - signal that network is required
      this.authState = {
        ...this.authState,
        isOffline: true,
        requiresReauth: true,
      };
      return { canContinue: false, reason: 'OfflineGracePeriodExpired' };
    }

    // Within grace period - can continue using cached token
    this.authState = {
      ...this.authState,
      isAuthenticated: true,
      isOffline: true,
    };
    return { canContinue: true };
  }

  /**
   * Get the access token for offline use.
   * Returns the cached token if within the offline grace period.
   * Does not attempt to refresh the token (since we're offline).
   *
   * @returns The cached access token or null if not available or grace period expired
   *
   * @example
   * ```typescript
   * // When device is offline
   * const token = await authService.getOfflineAccessToken();
   * if (token) {
   *   // Use cached token for local operations
   * } else {
   *   // Cannot proceed offline
   * }
   * ```
   */
  async getOfflineAccessToken(): Promise<string | null> {
    const config = this.ensureConfigured();

    // Check offline access
    const { canContinue } = await this.checkOfflineAccess();

    if (!canContinue) {
      return null;
    }

    // Return cached access token
    return config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  // ============================================
  // TokenProvider Interface (to be implemented in task 7 & 10)
  // ============================================

  /**
   * Get the current access token, refreshing if expired.
   * Retrieves the access token from secure storage and checks expiry.
   * If expired, attempts to refresh the token automatically.
   *
   * @returns The access token or null if not authenticated or refresh fails
   *
   * @example
   * ```typescript
   * const token = await authService.getAccessToken();
   * if (token) {
   *   // Use token for API request
   *   headers['Authorization'] = `Bearer ${token}`;
   * } else {
   *   // User needs to re-authenticate
   * }
   * ```
   */
  async getAccessToken(): Promise<string | null> {
    const config = this.ensureConfigured();

    // Retrieve access token from secure storage
    const accessToken = await config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    // Return null if no token exists
    if (!accessToken) {
      return null;
    }

    // Check expiry timestamp
    try {
      const expiryStr = await config.secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
      if (expiryStr) {
        const expiresAt = Number(expiryStr);
        const now = Date.now();

        // If token is expired, attempt to refresh
        if (isTokenExpired(expiresAt, now)) {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return newToken;
          }
          // Refresh failed - signal re-authentication required
          this.authState = {
            ...this.authState,
            requiresReauth: true,
          };
          return null;
        }
      }

      // Token is valid, return it
      return accessToken;
    } catch (error) {
      // On any failure during refresh, mark reauth required and fail closed
      this.authState = {
        ...this.authState,
        requiresReauth: true,
      };
      console.error('Failed to refresh access token:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token.
   * Sends refresh request to backend and stores new tokens on success.
   * Clears all tokens on refresh failure (expired/revoked).
   * Preserves tokens on network error.
   *
   * @returns The new access token or null on failure
   *
   * @example
   * ```typescript
   * const newToken = await authService.refreshToken();
   * if (newToken) {
   *   // Token refreshed successfully
   * } else {
   *   // Refresh failed, check authState.requiresReauth
   * }
   * ```
   */
  async refreshToken(): Promise<string | null> {
    try {
      return await this.refreshAccessToken();
    } catch (error) {
      // Avoid throwing to honor contract; mark reauth if it's an auth failure
      if (error instanceof AuthError) {
        this.authState = {
          ...this.authState,
          requiresReauth: true,
        };
      }
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Internal method to refresh the access token.
   * Implements a queue mechanism to handle concurrent 401 responses.
   * When multiple requests receive 401s simultaneously, only one refresh
   * request is made to the backend, and all pending requests receive
   * the same result.
   *
   * @returns The new access token or null on failure
   */
  async refreshAccessToken(): Promise<string | null> {
    const config = this.ensureConfigured();

    // If a refresh is already in progress, queue this request
    if (this.isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        this.pendingRefreshRequests.push({ resolve, reject });
      });
    }

    // Mark refresh as in progress
    this.isRefreshing = true;
    this.refreshCallCount++;

    try {
      const result = await this.performRefresh(config);

      // Resolve all pending requests with the same result
      this.resolvePendingRequests(result);

      return result;
    } catch (error) {
      // Reject all pending requests with the same error
      const authError =
        error instanceof AuthError
          ? error
          : new AuthError('Unknown', 'Refresh failed', error instanceof Error ? error : undefined);
      this.rejectPendingRequests(authError);

      throw authError;
    } finally {
      // Reset refresh state
      this.isRefreshing = false;
    }
  }

  /**
   * Perform the actual token refresh operation.
   * This is separated from refreshAccessToken to allow the queue mechanism
   * to wrap it.
   */
  private async performRefresh(config: AuthServiceConfig): Promise<string | null> {
    // Get the refresh token from storage
    const refreshToken = await config.secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      // No refresh token available
      this.authState = {
        ...this.authState,
        isAuthenticated: false,
        requiresReauth: true,
      };
      return null;
    }

    try {
      // Send refresh request to backend
      const response = await config.apiClient.post<RefreshResponse>('/api/auth/refresh', {
        refreshToken,
        deviceId: config.deviceId,
      });

      const now = Date.now();
      const normalizedResponse = normalizeRefreshResponse(response, now);

      // Store new access token
      await config.secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, normalizedResponse.accessToken);
      await config.secureStorage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
        normalizedResponse.accessTokenExpiresAt.toString()
      );

      // Store new refresh token if rotated
      if (normalizedResponse.refreshToken && normalizedResponse.refreshTokenExpiresAt) {
        await config.secureStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          normalizedResponse.refreshToken
        );
        await config.secureStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
          normalizedResponse.refreshTokenExpiresAt.toString()
        );
      }

      // Update last online timestamp
      await config.secureStorage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, now.toString());

      // Update auth state
      this.authState = {
        isAuthenticated: true,
        isOffline: false,
        requiresReauth: false,
      };

      return normalizedResponse.accessToken;
    } catch (error) {
      // Check if it's a network error - preserve tokens
      if (this.isNetworkError(error)) {
        this.authState = {
          ...this.authState,
          isOffline: true,
        };
        return null;
      }

      // Refresh failed due to expired/revoked token - clear all tokens
      await this.clearAllTokens();
      this.authState = {
        isAuthenticated: false,
        isOffline: false,
        requiresReauth: true,
      };
      return null;
    }
  }

  /**
   * Resolve all pending refresh requests with the given token.
   */
  private resolvePendingRequests(token: string | null): void {
    const pending = [...this.pendingRefreshRequests];
    this.pendingRefreshRequests = [];
    pending.forEach((request) => request.resolve(token));
  }

  /**
   * Reject all pending refresh requests with the given error.
   */
  private rejectPendingRequests(error: AuthError): void {
    const pending = [...this.pendingRefreshRequests];
    this.pendingRefreshRequests = [];
    pending.forEach((request) => request.reject(error));
  }

  /**
   * Clear all tokens from secure storage.
   * Used when refresh fails due to expired/revoked token.
   */
  private async clearAllTokens(): Promise<void> {
    const config = this.ensureConfigured();
    await Promise.allSettled([
      config.secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      config.secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      config.secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY),
      config.secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY),
    ]);
  }

  /**
   * Clear all stored tokens (TokenProvider interface).
   * Delegates to logout to ensure consistent state clearing.
   *
   * @example
   * ```typescript
   * // Called by API client when authentication fails
   * await authService.clearTokens();
   * ```
   */
  async clearTokens(): Promise<void> {
    await this.logout();
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Check if an error is a network-related error.
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      // TypeError is commonly thrown for fetch/network failures
      if (error instanceof TypeError) {
        return true;
      }

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return true;
      }

      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }
    // Check for API error with network type
    if (typeof error === 'object' && error !== null && 'type' in error) {
      const apiError = error as { type: string };
      return apiError.type === 'NetworkError' || apiError.type === 'TimeoutError';
    }
    return false;
  }

  /**
   * Check if an error indicates invalid credentials.
   */
  private isInvalidCredentialsError(error: unknown): boolean {
    // Check for 401 status code
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const apiError = error as { status: number };
      return apiError.status === 401;
    }
    // Check for API error type
    if (typeof error === 'object' && error !== null && 'type' in error) {
      const apiError = error as { type: string };
      return apiError.type === 'UnauthorizedError';
    }
    return false;
  }
}
