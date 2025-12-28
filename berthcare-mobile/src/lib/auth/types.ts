/**
 * Type definitions for the Auth Service module.
 *
 * This file contains all TypeScript interfaces and types used by the auth module,
 * including configuration options, authentication state, token data structures,
 * and API request/response contracts.
 *
 * @module @/lib/auth/types
 */

/**
 * Configuration options for the AuthService.
 *
 * @example
 * ```typescript
 * const config: AuthServiceConfig = {
 *   apiClient: myApiClient,
 *   secureStorage: secureStorage,
 *   deviceId: 'unique-device-id',
 *   offlineGracePeriodDays: 7,
 * };
 * AuthService.configure(config);
 * ```
 */
export interface AuthServiceConfig {
  /** The API client instance for making HTTP requests */
  apiClient: ApiClientInterface;
  /** The secure storage adapter for persisting tokens */
  secureStorage: SecureStorageAdapter;
  /** Unique identifier for this device, used for device-bound refresh tokens */
  deviceId: string;
  /** Number of days tokens remain valid while offline (default: 7) */
  offlineGracePeriodDays?: number;
}

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

/**
 * Runtime validation for AuthServiceConfig to guard against misconfiguration.
 */
export function assertAuthServiceConfig(config: unknown): asserts config is AuthServiceConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('AuthService config is required');
  }

  const typedConfig = config as AuthServiceConfig;

  if (!typedConfig.apiClient) {
    throw new Error('apiClient is required');
  }
  if (!isFunction(typedConfig.apiClient.post)) {
    throw new Error('apiClient.post is required');
  }
  if (
    'setTokenProvider' in typedConfig.apiClient &&
    typedConfig.apiClient.setTokenProvider != null &&
    !isFunction(typedConfig.apiClient.setTokenProvider)
  ) {
    throw new Error('apiClient.setTokenProvider must be a function');
  }

  if (!typedConfig.secureStorage) {
    throw new Error('secureStorage is required');
  }
  if (
    !isFunction(typedConfig.secureStorage.setItem) ||
    !isFunction(typedConfig.secureStorage.getItem) ||
    !isFunction(typedConfig.secureStorage.removeItem) ||
    !isFunction(typedConfig.secureStorage.clear)
  ) {
    throw new Error('secureStorage must implement setItem/getItem/removeItem/clear');
  }

  if (typeof typedConfig.deviceId !== 'string' || typedConfig.deviceId.trim() === '') {
    throw new Error('deviceId is required and cannot be empty');
  }

  if (
    typedConfig.offlineGracePeriodDays != null &&
    (!Number.isFinite(typedConfig.offlineGracePeriodDays) ||
      typedConfig.offlineGracePeriodDays <= 0)
  ) {
    throw new Error('offlineGracePeriodDays must be a positive number');
  }
}

/**
 * Minimal interface for the API client dependency.
 *
 * The auth service requires an API client that can make POST requests
 * and optionally accept a TokenProvider for automatic token injection.
 *
 * @example
 * ```typescript
 * const apiClient: ApiClientInterface = {
 *   post: async (url, data) => {
 *     const response = await fetch(url, {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     return response.json();
 *   },
 *   setTokenProvider: (provider) => {
 *     // Store provider for automatic token injection
 *   },
 * };
 * ```
 */
export interface ApiClientInterface {
  /** Make a POST request to the given URL with optional data */
  post<T>(url: string, data?: unknown): Promise<T>;
  /** Set the token provider for automatic token injection and refresh */
  setTokenProvider?(provider: TokenProvider): void;
}

/**
 * Interface for secure storage operations.
 *
 * Implementations should use platform-native secure storage:
 * - iOS: Keychain Services
 * - Android: Keystore
 *
 * The default implementation uses react-native-keychain.
 *
 * @example
 * ```typescript
 * // Using the default implementation
 * import { secureStorage } from '@/lib/auth';
 *
 * // Or create a custom implementation
 * const customStorage: SecureStorageAdapter = {
 *   setItem: async (key, value) => { ... },
 *   getItem: async (key) => { ... },
 *   removeItem: async (key) => { ... },
 *   clear: async () => { ... },
 * };
 * ```
 */
export interface SecureStorageAdapter {
  /** Store a value securely with the given key */
  setItem(key: string, value: string): Promise<void>;
  /** Retrieve a value by key, returns null if not found */
  getItem(key: string): Promise<string | null>;
  /** Remove a value by key */
  removeItem(key: string): Promise<void>;
  /** Clear all stored values */
  clear(): Promise<void>;
}

/**
 * Interface that AuthService implements for API client integration.
 *
 * The API client uses this interface to:
 * 1. Get the current access token for request headers
 * 2. Refresh the token when a 401 response is received
 * 3. Clear tokens when authentication fails completely
 *
 * @example
 * ```typescript
 * // API client integration
 * class ApiClient {
 *   private tokenProvider?: TokenProvider;
 *
 *   setTokenProvider(provider: TokenProvider) {
 *     this.tokenProvider = provider;
 *   }
 *
 *   async request(url: string) {
 *     const token = await this.tokenProvider?.getAccessToken();
 *     const response = await fetch(url, {
 *       headers: token ? { Authorization: `Bearer ${token}` } : {},
 *     });
 *
 *     if (response.status === 401) {
 *       const newToken = await this.tokenProvider?.refreshToken();
 *       if (newToken) {
 *         // Retry with new token
 *       } else {
 *         await this.tokenProvider?.clearTokens();
 *       }
 *     }
 *     return response;
 *   }
 * }
 * ```
 */
export interface TokenProvider {
  /** Get the current access token, refreshing if expired */
  getAccessToken(): Promise<string | null>;
  /** Refresh the access token using the refresh token */
  refreshToken(): Promise<string | null>;
  /** Clear all stored tokens (logout) */
  clearTokens(): Promise<void>;
  /** Optional hook for API clients to inspect auth state */
  getAuthState?(): AuthState;
}

/**
 * Result of a login operation.
 *
 * @example
 * ```typescript
 * const result: LoginResult = await authService.login(email, password);
 * if (result.success) {
 *   // Navigate to main app
 * } else {
 *   // Handle error
 *   console.error(result.error?.type, result.error?.message);
 * }
 * ```
 */
export interface LoginResult {
  /** Whether the login was successful */
  success: boolean;
  /** Error details if login failed */
  error?: import('./auth-error').AuthError;
}

/**
 * Current authentication state.
 *
 * This state is maintained in memory and updated by auth operations.
 * Use `authService.getAuthState()` to get the current state.
 *
 * @example
 * ```typescript
 * const state: AuthState = authService.getAuthState();
 * if (state.requiresReauth) {
 *   // Navigate to login screen
 * } else if (state.isOffline) {
 *   // Show offline indicator
 * }
 * ```
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether the device is currently offline */
  isOffline: boolean;
  /** Whether re-authentication is required (tokens expired/revoked) */
  requiresReauth: boolean;
}

/**
 * Token pair containing both access and refresh tokens with expiry times.
 *
 * This represents the complete token data after a successful login or refresh.
 */
export interface TokenPair {
  /** JWT access token for API authentication (24-hour expiry) */
  accessToken: string;
  /** Refresh token for obtaining new access tokens (7-day offline grace, 30-day max) */
  refreshToken: string;
  /** Access token expiry as Unix timestamp in milliseconds */
  accessTokenExpiresAt: number;
  /** Refresh token expiry as Unix timestamp in milliseconds */
  refreshTokenExpiresAt: number;
}

/**
 * Data structure for stored token information.
 *
 * Used internally for token persistence in secure storage.
 */
export interface StoredTokenData {
  /** The token string */
  token: string;
  /** Expiry as Unix timestamp in milliseconds */
  expiresAt: number;
}

/**
 * Request payload for the login endpoint (POST /auth/login).
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** Unique device identifier for device-bound tokens */
  deviceId: string;
}

/**
 * Response from the login endpoint (POST /auth/login).
 */
export interface LoginResponseSeconds {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token lifetime in seconds */
  accessTokenExpiresIn: number;
  /** Refresh token lifetime in seconds */
  refreshTokenExpiresIn: number;
}

/**
 * Response from the login endpoint when expiries are absolute timestamps.
 */
export interface LoginResponseTimestamps {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token expiry as ISO timestamp */
  accessTokenExpiresAt: string;
  /** Refresh token expiry as ISO timestamp */
  refreshTokenExpiresAt: string;
}

/**
 * Legacy login response timestamps from backend routes.
 */
export interface LoginResponseLegacyTimestamps {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token expiry as ISO timestamp */
  accessExpiresAt: string;
  /** Refresh token expiry as ISO timestamp */
  refreshExpiresAt: string;
}

/**
 * Response from the login endpoint (POST /auth/login).
 *
 * Supports either expiry seconds or absolute expiry timestamps.
 */
export type LoginResponse =
  | LoginResponseSeconds
  | LoginResponseTimestamps
  | LoginResponseLegacyTimestamps;

/**
 * Request payload for the refresh endpoint (POST /auth/refresh).
 */
export interface RefreshRequest {
  /** Current refresh token */
  refreshToken: string;
  /** Device identifier (must match the one used during login) */
  deviceId: string;
}

/**
 * Response from the refresh endpoint (POST /auth/refresh).
 */
export interface RefreshResponseSeconds {
  /** New JWT access token */
  accessToken: string;
  /** New refresh token (only present if token rotation is enabled) */
  refreshToken?: string;
  /** Access token lifetime in seconds */
  accessTokenExpiresIn: number;
  /** Refresh token lifetime in seconds (only present if rotated) */
  refreshTokenExpiresIn?: number;
}

/**
 * Response from the refresh endpoint when expiries are absolute timestamps.
 */
export interface RefreshResponseTimestamps {
  /** New JWT access token */
  accessToken: string;
  /** New refresh token (only present if token rotation is enabled) */
  refreshToken?: string;
  /** Access token expiry as ISO timestamp */
  accessTokenExpiresAt: string;
  /** Refresh token expiry as ISO timestamp (only present if rotated) */
  refreshTokenExpiresAt?: string;
}

/**
 * Legacy refresh response timestamps from backend routes.
 */
export interface RefreshResponseLegacyTimestamps {
  /** New JWT access token */
  accessToken: string;
  /** New refresh token (only present if token rotation is enabled) */
  refreshToken?: string;
  /** Access token expiry as ISO timestamp */
  accessExpiresAt: string;
  /** Refresh token expiry as ISO timestamp (only present if rotated) */
  refreshExpiresAt?: string;
}

/**
 * Response from the refresh endpoint (POST /auth/refresh).
 *
 * Supports either expiry seconds or absolute expiry timestamps.
 */
export type RefreshResponse =
  | RefreshResponseSeconds
  | RefreshResponseTimestamps
  | RefreshResponseLegacyTimestamps;

export interface NormalizedLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
}

export interface NormalizedRefreshResponse {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken?: string;
  refreshTokenExpiresAt?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

const isIsoDateString = (value: unknown): value is string =>
  isNonEmptyString(value) && ISO_DATE_REGEX.test(value) && !Number.isNaN(Date.parse(value));

const parseIsoExpiry = (value: string, errorMessage: string): number => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(errorMessage);
  }
  return timestamp;
};

const parseOptionalIsoExpiry = (
  value: string | undefined,
  errorMessage: string
): number | undefined => {
  if (value == null) {
    return undefined;
  }
  return parseIsoExpiry(value, errorMessage);
};

export const isLoginResponseSeconds = (value: unknown): value is LoginResponseSeconds => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.accessToken) &&
    isNonEmptyString(value.refreshToken) &&
    isPositiveNumber(value.accessTokenExpiresIn) &&
    isPositiveNumber(value.refreshTokenExpiresIn)
  );
};

export const isLoginResponseTimestamps = (value: unknown): value is LoginResponseTimestamps => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.accessToken) &&
    isNonEmptyString(value.refreshToken) &&
    isIsoDateString(value.accessTokenExpiresAt) &&
    isIsoDateString(value.refreshTokenExpiresAt)
  );
};

export const isLoginResponseLegacyTimestamps = (
  value: unknown
): value is LoginResponseLegacyTimestamps => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.accessToken) &&
    isNonEmptyString(value.refreshToken) &&
    isIsoDateString(value.accessExpiresAt) &&
    isIsoDateString(value.refreshExpiresAt)
  );
};

export const isRefreshResponseSeconds = (value: unknown): value is RefreshResponseSeconds => {
  if (!isRecord(value)) {
    return false;
  }

  if (!isNonEmptyString(value.accessToken) || !isPositiveNumber(value.accessTokenExpiresIn)) {
    return false;
  }

  if (value.refreshToken != null) {
    return isNonEmptyString(value.refreshToken) && isPositiveNumber(value.refreshTokenExpiresIn);
  }

  return value.refreshTokenExpiresIn == null;
};

export const isRefreshResponseTimestamps = (value: unknown): value is RefreshResponseTimestamps => {
  if (!isRecord(value)) {
    return false;
  }

  if (!isNonEmptyString(value.accessToken) || !isIsoDateString(value.accessTokenExpiresAt)) {
    return false;
  }

  if (value.refreshToken != null) {
    return isNonEmptyString(value.refreshToken) && isIsoDateString(value.refreshTokenExpiresAt);
  }

  return value.refreshTokenExpiresAt == null;
};

export const isRefreshResponseLegacyTimestamps = (
  value: unknown
): value is RefreshResponseLegacyTimestamps => {
  if (!isRecord(value)) {
    return false;
  }

  if (!isNonEmptyString(value.accessToken) || !isIsoDateString(value.accessExpiresAt)) {
    return false;
  }

  if (value.refreshToken != null) {
    return isNonEmptyString(value.refreshToken) && isIsoDateString(value.refreshExpiresAt);
  }

  return value.refreshExpiresAt == null;
};

export function normalizeLoginResponse(value: unknown, now = Date.now()): NormalizedLoginResponse {
  if (isLoginResponseSeconds(value)) {
    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      accessTokenExpiresAt: now + value.accessTokenExpiresIn * 1000,
      refreshTokenExpiresAt: now + value.refreshTokenExpiresIn * 1000,
    };
  }

  if (isLoginResponseTimestamps(value)) {
    const accessTokenExpiresAt = parseIsoExpiry(
      value.accessTokenExpiresAt,
      'Invalid login response expiry timestamps'
    );
    const refreshTokenExpiresAt = parseIsoExpiry(
      value.refreshTokenExpiresAt,
      'Invalid login response expiry timestamps'
    );

    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  if (isLoginResponseLegacyTimestamps(value)) {
    const accessTokenExpiresAt = parseIsoExpiry(
      value.accessExpiresAt,
      'Invalid login response expiry timestamps'
    );
    const refreshTokenExpiresAt = parseIsoExpiry(
      value.refreshExpiresAt,
      'Invalid login response expiry timestamps'
    );

    return {
      accessToken: value.accessToken,
      refreshToken: value.refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  throw new Error('Invalid login response');
}

export function normalizeRefreshResponse(
  value: unknown,
  now = Date.now()
): NormalizedRefreshResponse {
  if (isRefreshResponseSeconds(value)) {
    const refreshTokenExpiresAt =
      value.refreshToken != null && value.refreshTokenExpiresIn != null
        ? now + value.refreshTokenExpiresIn * 1000
        : undefined;

    const baseResponse = {
      accessToken: value.accessToken,
      accessTokenExpiresAt: now + value.accessTokenExpiresIn * 1000,
    };

    if (value.refreshToken != null && refreshTokenExpiresAt != null) {
      return {
        ...baseResponse,
        refreshToken: value.refreshToken,
        refreshTokenExpiresAt,
      };
    }

    return baseResponse;
  }

  if (isRefreshResponseTimestamps(value)) {
    const accessTokenExpiresAt = parseIsoExpiry(
      value.accessTokenExpiresAt,
      'Invalid refresh response access expiry'
    );
    const refreshTokenExpiresAt = parseOptionalIsoExpiry(
      value.refreshTokenExpiresAt,
      'Invalid refresh response refresh expiry'
    );

    const baseResponse = {
      accessToken: value.accessToken,
      accessTokenExpiresAt,
    };

    if (value.refreshToken != null && refreshTokenExpiresAt != null) {
      return {
        ...baseResponse,
        refreshToken: value.refreshToken,
        refreshTokenExpiresAt,
      };
    }

    return baseResponse;
  }

  if (isRefreshResponseLegacyTimestamps(value)) {
    const accessTokenExpiresAt = parseIsoExpiry(
      value.accessExpiresAt,
      'Invalid refresh response access expiry'
    );
    const refreshTokenExpiresAt = parseOptionalIsoExpiry(
      value.refreshExpiresAt,
      'Invalid refresh response refresh expiry'
    );

    const baseResponse = {
      accessToken: value.accessToken,
      accessTokenExpiresAt,
    };

    if (value.refreshToken != null && refreshTokenExpiresAt != null) {
      return {
        ...baseResponse,
        refreshToken: value.refreshToken,
        refreshTokenExpiresAt,
      };
    }

    return baseResponse;
  }

  throw new Error('Invalid refresh response');
}

/**
 * Pending refresh request for queue management.
 *
 * When multiple API requests receive 401 responses simultaneously,
 * they are queued and resolved together after a single refresh operation.
 *
 * @internal Used internally by AuthService for refresh queue management
 */
export interface PendingRefreshRequest {
  /** Resolve the pending request with the new token (or null on failure) */
  resolve: (token: string | null) => void;
  /** Reject the pending request with an error */
  reject: (error: import('./auth-error').AuthError) => void;
}

/**
 * State for managing concurrent refresh requests.
 *
 * This ensures that when multiple 401 responses occur simultaneously,
 * only one refresh request is made to the backend.
 *
 * @internal Used internally by AuthService for refresh queue management
 */
export interface RefreshQueueState {
  /** Whether a refresh operation is currently in progress */
  isRefreshing: boolean;
  /** Queue of pending requests waiting for the refresh to complete */
  pendingRequests: PendingRefreshRequest[];
}
