/**
 * Type definitions for the Auth Service module.
 * Provides interfaces for token management, authentication state, and API contracts.
 */

/**
 * Configuration options for the AuthService.
 */
export interface AuthServiceConfig {
  apiClient: ApiClientInterface;
  secureStorage: SecureStorageAdapter;
  deviceId: string;
  offlineGracePeriodDays?: number; // Default: 7
}

/**
 * Minimal interface for the API client dependency.
 */
export interface ApiClientInterface {
  post<T>(url: string, data?: unknown): Promise<T>;
  setTokenProvider?(provider: TokenProvider): void;
}

/**
 * Interface for secure storage operations.
 */
export interface SecureStorageAdapter {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Interface that AuthService implements for API client integration.
 */
export interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshToken(): Promise<string | null>;
  clearTokens(): Promise<void>;
}

/**
 * Result of a login operation.
 */
export interface LoginResult {
  success: boolean;
  error?: import('./auth-error').AuthError;
}

/**
 * Current authentication state.
 */
export interface AuthState {
  isAuthenticated: boolean;
  isOffline: boolean;
  requiresReauth: boolean;
}


/**
 * Token pair returned from authentication endpoints.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // Unix timestamp (ms)
  refreshTokenExpiresAt: number; // Unix timestamp (ms)
}

/**
 * Data structure for stored token information.
 */
export interface StoredTokenData {
  token: string;
  expiresAt: number;
}

/**
 * Request payload for login endpoint.
 */
export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

/**
 * Response from login endpoint.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number; // seconds
  refreshTokenExpiresIn: number; // seconds
}

/**
 * Request payload for refresh endpoint.
 */
export interface RefreshRequest {
  refreshToken: string;
  deviceId: string;
}

/**
 * Response from refresh endpoint.
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string; // Optional rotation
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn?: number;
}

/**
 * Pending refresh request for queue management.
 */
export interface PendingRefreshRequest {
  resolve: (token: string | null) => void;
  reject: (error: import('./auth-error').AuthError) => void;
}

/**
 * State for managing concurrent refresh requests.
 */
export interface RefreshQueueState {
  isRefreshing: boolean;
  pendingRequests: PendingRefreshRequest[];
}
