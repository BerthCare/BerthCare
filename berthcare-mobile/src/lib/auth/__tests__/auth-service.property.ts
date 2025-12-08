// **Feature: mobile-secure-token-storage, Property 3: Successful login stores both tokens**
// **Validates: Requirements 2.1, 2.2, 2.3**

// **Feature: mobile-secure-token-storage, Property 4: Failed login preserves existing state**
// **Validates: Requirements 2.4, 2.5**

// **Feature: mobile-secure-token-storage, Property 2: Logout clears all authentication state**
// **Validates: Requirements 1.5, 3.1, 3.2, 3.3, 3.4**

import fc from 'fast-check';
import type {
  SecureStorageAdapter,
  ApiClientInterface,
  LoginResponse,
  RefreshResponse,
} from '../types';
import { AuthService } from '../auth';
import { STORAGE_KEYS } from '../secure-storage';

/**
 * In-memory implementation of SecureStorageAdapter for testing.
 */
class InMemorySecureStorage implements SecureStorageAdapter {
  private storage: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach((key) => this.storage.delete(key));
  }

  // Helper for testing
  getAll(): Map<string, string> {
    return new Map(this.storage);
  }
}

/**
 * Mock API client for testing.
 */
class MockApiClient implements ApiClientInterface {
  private mockLoginResponse: LoginResponse | null = null;
  private mockRefreshResponse: RefreshResponse | null = null;
  private shouldThrowNetworkError = false;
  private shouldThrow401 = false;

  setMockResponse(response: LoginResponse): void {
    this.mockLoginResponse = response;
    this.shouldThrowNetworkError = false;
    this.shouldThrow401 = false;
  }

  setRefreshResponse(response: RefreshResponse): void {
    this.mockRefreshResponse = response;
    this.shouldThrowNetworkError = false;
    this.shouldThrow401 = false;
  }

  setNetworkError(): void {
    this.shouldThrowNetworkError = true;
    this.shouldThrow401 = false;
    this.mockLoginResponse = null;
    this.mockRefreshResponse = null;
  }

  set401Error(): void {
    this.shouldThrow401 = true;
    this.shouldThrowNetworkError = false;
    this.mockLoginResponse = null;
    this.mockRefreshResponse = null;
  }

  async post<T>(url: string, _data?: unknown): Promise<T> {
    if (this.shouldThrowNetworkError) {
      throw new Error('Network error: Failed to fetch');
    }
    if (this.shouldThrow401) {
      const error = new Error('Unauthorized') as Error & { status: number };
      error.status = 401;
      throw error;
    }
    // Route to appropriate mock response based on URL
    if (url.includes('/refresh') && this.mockRefreshResponse) {
      return this.mockRefreshResponse as T;
    }
    if (url.includes('/login') && this.mockLoginResponse) {
      return this.mockLoginResponse as T;
    }
    if (this.mockLoginResponse) {
      return this.mockLoginResponse as T;
    }
    if (this.mockRefreshResponse) {
      return this.mockRefreshResponse as T;
    }
    throw new Error('No mock response configured');
  }
}

describe('Feature: mobile-secure-token-storage, Property 3: Successful login stores both tokens', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any valid login credentials, after successful login both access and refresh tokens are stored', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid email-like strings
        fc.emailAddress(),
        // Generate password strings
        fc.string({ minLength: 8, maxLength: 100 }),
        // Generate token responses
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessTokenExpiresIn: fc.integer({ min: 60, max: 86400 }), // 1 min to 24 hours
          refreshTokenExpiresIn: fc.integer({ min: 86400, max: 2592000 }), // 1 day to 30 days
        }),
        async (email, password, tokenResponse) => {
          // Reset storage for each test
          await storage.clear();

          // Configure mock to return the generated tokens
          apiClient.setMockResponse(tokenResponse);

          // Perform login
          const authService = AuthService.getInstance();
          const result = await authService.login(email, password);

          // Login should succeed
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();

          // Access token should be stored
          const storedAccessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          expect(storedAccessToken).toBe(tokenResponse.accessToken);

          // Refresh token should be stored
          const storedRefreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          expect(storedRefreshToken).toBe(tokenResponse.refreshToken);

          // Expiry timestamps should be stored
          const accessExpiry = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
          expect(accessExpiry).not.toBeNull();
          expect(Number(accessExpiry)).toBeGreaterThan(Date.now());

          const refreshExpiry = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);
          expect(refreshExpiry).not.toBeNull();
          expect(Number(refreshExpiry)).toBeGreaterThan(Date.now());

          // Auth state should be updated
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(true);
          expect(authState.requiresReauth).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: mobile-secure-token-storage, Property 4: Failed login preserves existing state', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any invalid login attempt, existing tokens in storage remain unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate existing tokens that might be in storage
        fc.record({
          existingAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          existingRefreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          existingAccessExpiry: fc
            .integer({ min: Date.now(), max: Date.now() + 86400000 })
            .map(String),
          existingRefreshExpiry: fc
            .integer({ min: Date.now(), max: Date.now() + 2592000000 })
            .map(String),
        }),
        // Generate login credentials
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (existingTokens, email, password) => {
          // Pre-populate storage with existing tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.existingAccessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.existingRefreshToken);
          await storage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
            existingTokens.existingAccessExpiry
          );
          await storage.setItem(
            STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
            existingTokens.existingRefreshExpiry
          );

          // Configure mock to return 401 (invalid credentials)
          apiClient.set401Error();

          // Attempt login
          const authService = AuthService.getInstance();
          const result = await authService.login(email, password);

          // Login should fail
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.type).toBe('InvalidCredentials');

          // Existing tokens should be preserved
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(
            existingTokens.existingAccessToken
          );
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe(
            existingTokens.existingRefreshToken
          );
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBe(
            existingTokens.existingAccessExpiry
          );
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBe(
            existingTokens.existingRefreshExpiry
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any network error during login, existing tokens in storage remain unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate existing tokens
        fc.record({
          existingAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          existingRefreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          existingAccessExpiry: fc
            .integer({ min: Date.now(), max: Date.now() + 86400000 })
            .map(String),
          existingRefreshExpiry: fc
            .integer({ min: Date.now(), max: Date.now() + 2592000000 })
            .map(String),
        }),
        // Generate login credentials
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        async (existingTokens, email, password) => {
          // Pre-populate storage with existing tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.existingAccessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.existingRefreshToken);
          await storage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
            existingTokens.existingAccessExpiry
          );
          await storage.setItem(
            STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
            existingTokens.existingRefreshExpiry
          );

          // Configure mock to throw network error
          apiClient.setNetworkError();

          // Attempt login
          const authService = AuthService.getInstance();
          const result = await authService.login(email, password);

          // Login should fail with network error
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.type).toBe('NetworkError');

          // Existing tokens should be preserved
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(
            existingTokens.existingAccessToken
          );
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe(
            existingTokens.existingRefreshToken
          );
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBe(
            existingTokens.existingAccessExpiry
          );
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBe(
            existingTokens.existingRefreshExpiry
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: mobile-secure-token-storage, Property 2: Logout clears all authentication state', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any authenticated state, calling logout results in all tokens being cleared', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate token response for initial login
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessTokenExpiresIn: fc.integer({ min: 60, max: 86400 }),
          refreshTokenExpiresIn: fc.integer({ min: 86400, max: 2592000 }),
        }),
        async (tokenResponse) => {
          // First, login to establish authenticated state
          apiClient.setMockResponse(tokenResponse);
          const authService = AuthService.getInstance();
          const loginResult = await authService.login('test@example.com', 'password123');
          expect(loginResult.success).toBe(true);

          // Verify tokens are stored
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(tokenResponse.accessToken);
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe(
            tokenResponse.refreshToken
          );

          // Now logout
          await authService.logout();

          // Access token should be null
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();

          // Refresh token should be null
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();

          // Expiry timestamps should be null
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBeNull();

          // Auth state should indicate not authenticated and requires reauth
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(false);
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any stored tokens, logout clears them regardless of their values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary tokens to store directly
        fc.record({
          accessToken: fc.string({ minLength: 1, maxLength: 1000 }),
          refreshToken: fc.string({ minLength: 1, maxLength: 1000 }),
          accessExpiry: fc.integer({ min: 0 }).map(String),
          refreshExpiry: fc.integer({ min: 0 }).map(String),
        }),
        async (tokens) => {
          // Directly store tokens (simulating any authenticated state)
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, tokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, tokens.refreshExpiry);

          // Logout
          const authService = AuthService.getInstance();
          await authService.logout();

          // All tokens should be cleared
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBeNull();

          // Auth state should require reauth
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(false);
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-secure-token-storage, Property 5: Expired access token triggers refresh**
// **Validates: Requirements 4.1, 4.2, 4.4**

describe('Feature: mobile-secure-token-storage, Property 5: Expired access token triggers refresh', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any expired access token with valid refresh token, getAccessToken attempts refresh and returns new token on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate expired access token (expiry in the past)
        fc.record({
          expiredAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          // Expiry time in the past (1 hour to 7 days ago)
          expiredAt: fc.integer({
            min: Date.now() - 7 * 24 * 60 * 60 * 1000,
            max: Date.now() - 1000,
          }),
          // Valid refresh token expiry (in the future)
          refreshExpiry: fc.integer({
            min: Date.now() + 1000,
            max: Date.now() + 30 * 24 * 60 * 60 * 1000,
          }),
        }),
        // Generate new token response from refresh
        fc.record({
          newAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessTokenExpiresIn: fc.integer({ min: 60, max: 86400 }), // 1 min to 24 hours
        }),
        async (existingTokens, refreshResponse) => {
          // Pre-populate storage with expired access token and valid refresh token
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.expiredAccessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
            existingTokens.expiredAt.toString()
          );
          await storage.setItem(
            STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
            existingTokens.refreshExpiry.toString()
          );

          // Configure mock to return new token on refresh
          apiClient.setRefreshResponse({
            accessToken: refreshResponse.newAccessToken,
            accessTokenExpiresIn: refreshResponse.accessTokenExpiresIn,
          });

          // Call getAccessToken
          const authService = AuthService.getInstance();
          const token = await authService.getAccessToken();

          // Should return the new access token
          expect(token).toBe(refreshResponse.newAccessToken);

          // New token should be stored
          const storedToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          expect(storedToken).toBe(refreshResponse.newAccessToken);

          // New expiry should be in the future
          const newExpiry = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
          expect(Number(newExpiry)).toBeGreaterThan(Date.now());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any expired access token, when refresh fails, getAccessToken returns null and signals re-auth required', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate expired access token
        fc.record({
          expiredAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          expiredAt: fc.integer({
            min: Date.now() - 7 * 24 * 60 * 60 * 1000,
            max: Date.now() - 1000,
          }),
          refreshExpiry: fc.integer({
            min: Date.now() + 1000,
            max: Date.now() + 30 * 24 * 60 * 60 * 1000,
          }),
        }),
        async (existingTokens) => {
          // Pre-populate storage with expired access token
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.expiredAccessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(
            STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
            existingTokens.expiredAt.toString()
          );
          await storage.setItem(
            STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
            existingTokens.refreshExpiry.toString()
          );

          // Configure mock to fail refresh (token revoked)
          apiClient.set401Error();

          // Call getAccessToken
          const authService = AuthService.getInstance();
          const token = await authService.getAccessToken();

          // Should return null
          expect(token).toBeNull();

          // Auth state should require re-auth
          const authState = authService.getAuthState();
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-secure-token-storage, Property 6: Refresh failure clears tokens**
// **Validates: Requirements 5.4**

describe('Feature: mobile-secure-token-storage, Property 6: Refresh failure clears tokens', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any refresh attempt that fails due to expired/revoked token, all stored tokens are cleared', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate existing tokens in storage
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessExpiry: fc
            .integer({ min: Date.now() - 86400000, max: Date.now() - 1000 })
            .map(String), // Expired
          refreshExpiry: fc
            .integer({ min: Date.now() + 1000, max: Date.now() + 2592000000 })
            .map(String),
        }),
        async (existingTokens) => {
          // Pre-populate storage with tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, existingTokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, existingTokens.refreshExpiry);

          // Configure mock to fail refresh (401 - token expired/revoked)
          apiClient.set401Error();

          // Attempt to refresh
          const authService = AuthService.getInstance();
          const result = await authService.refreshAccessToken();

          // Refresh should fail
          expect(result).toBeNull();

          // All tokens should be cleared
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBeNull();

          // Auth state should require re-auth
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(false);
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-secure-token-storage, Property 7: Network error during refresh preserves tokens**
// **Validates: Requirements 5.5**

describe('Feature: mobile-secure-token-storage, Property 7: Network error during refresh preserves tokens', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any refresh attempt that fails due to network error, existing tokens remain in storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate existing tokens in storage
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessExpiry: fc
            .integer({ min: Date.now() - 86400000, max: Date.now() - 1000 })
            .map(String), // Expired
          refreshExpiry: fc
            .integer({ min: Date.now() + 1000, max: Date.now() + 2592000000 })
            .map(String),
        }),
        async (existingTokens) => {
          // Pre-populate storage with tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, existingTokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, existingTokens.refreshExpiry);

          // Configure mock to throw network error
          apiClient.setNetworkError();

          // Attempt to refresh
          const authService = AuthService.getInstance();
          const result = await authService.refreshAccessToken();

          // Refresh should fail
          expect(result).toBeNull();

          // Existing tokens should be preserved
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe(existingTokens.accessToken);
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe(
            existingTokens.refreshToken
          );
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBe(
            existingTokens.accessExpiry
          );
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBe(
            existingTokens.refreshExpiry
          );

          // Auth state should indicate offline
          const authState = authService.getAuthState();
          expect(authState.isOffline).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-secure-token-storage, Property 8: Single refresh for concurrent 401s**
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

describe('Feature: mobile-secure-token-storage, Property 8: Single refresh for concurrent 401s', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any set of N concurrent 401 responses, exactly one refresh request is made and all requests receive the same token', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of concurrent requests (2 to 10)
        fc.integer({ min: 2, max: 10 }),
        // Generate existing tokens in storage
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          // Expired access token
          accessExpiry: fc
            .integer({ min: Date.now() - 86400000, max: Date.now() - 1000 })
            .map(String),
          refreshExpiry: fc
            .integer({ min: Date.now() + 1000, max: Date.now() + 2592000000 })
            .map(String),
        }),
        // Generate new token response
        fc.record({
          newAccessToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessTokenExpiresIn: fc.integer({ min: 60, max: 86400 }),
        }),
        async (numConcurrentRequests, existingTokens, refreshResponse) => {
          // Pre-populate storage with expired access token and valid refresh token
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, existingTokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, existingTokens.refreshExpiry);

          // Configure mock to return new token on refresh
          apiClient.setRefreshResponse({
            accessToken: refreshResponse.newAccessToken,
            accessTokenExpiresIn: refreshResponse.accessTokenExpiresIn,
          });

          const authService = AuthService.getInstance();
          authService.resetRefreshCallCount();

          // Fire N concurrent refresh requests (simulating N concurrent 401 responses)
          const refreshPromises: Promise<string | null>[] = [];
          for (let i = 0; i < numConcurrentRequests; i++) {
            refreshPromises.push(authService.refreshAccessToken());
          }

          // Wait for all to complete
          const results = await Promise.all(refreshPromises);

          // All requests should receive the same token
          results.forEach((token) => {
            expect(token).toBe(refreshResponse.newAccessToken);
          });

          // Only one refresh request should have been made to the backend
          expect(authService.getRefreshCallCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any set of N concurrent 401 responses when refresh fails, all requests receive null and tokens are cleared', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate number of concurrent requests (2 to 10)
        fc.integer({ min: 2, max: 10 }),
        // Generate existing tokens in storage
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          accessExpiry: fc
            .integer({ min: Date.now() - 86400000, max: Date.now() - 1000 })
            .map(String),
          refreshExpiry: fc
            .integer({ min: Date.now() + 1000, max: Date.now() + 2592000000 })
            .map(String),
        }),
        async (numConcurrentRequests, existingTokens) => {
          // Pre-populate storage with tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, existingTokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, existingTokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, existingTokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, existingTokens.refreshExpiry);

          // Configure mock to fail refresh (401 - token revoked)
          apiClient.set401Error();

          const authService = AuthService.getInstance();
          authService.resetRefreshCallCount();

          // Fire N concurrent refresh requests
          const refreshPromises: Promise<string | null>[] = [];
          for (let i = 0; i < numConcurrentRequests; i++) {
            refreshPromises.push(authService.refreshAccessToken());
          }

          // Wait for all to complete
          const results = await Promise.all(refreshPromises);

          // All requests should receive null
          results.forEach((token) => {
            expect(token).toBeNull();
          });

          // Only one refresh request should have been made
          expect(authService.getRefreshCallCount()).toBe(1);

          // Tokens should be cleared
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();

          // Auth state should require re-auth
          const authState = authService.getAuthState();
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Feature: mobile-secure-token-storage, Property 9: Token persistence across restarts**
// **Validates: Requirements 7.1, 7.2, 7.3**

describe('Feature: mobile-secure-token-storage, Property 9: Token persistence across restarts', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any stored valid tokens, creating a new AuthService instance restores the same authentication state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid tokens with future expiry
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          // Access token expiry in the future (1 hour to 24 hours from now)
          accessExpiry: fc.integer({ min: Date.now() + 3600000, max: Date.now() + 86400000 }),
          // Refresh token expiry in the future (1 day to 30 days from now)
          refreshExpiry: fc.integer({ min: Date.now() + 86400000, max: Date.now() + 2592000000 }),
        }),
        async (tokens) => {
          // Pre-populate storage with valid tokens (simulating previous session)
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, tokens.accessExpiry.toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, tokens.refreshExpiry.toString());

          // Configure AuthService (simulating app restart)
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
          });

          // Check authentication state
          const authService = AuthService.getInstance();
          const isAuthenticated = await authService.isAuthenticated();

          // Should be authenticated since tokens are valid
          expect(isAuthenticated).toBe(true);

          // Auth state should reflect authenticated
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(true);
          expect(authState.requiresReauth).toBe(false);

          // Should be able to retrieve the access token
          const retrievedToken = await authService.getAccessToken();
          expect(retrievedToken).toBe(tokens.accessToken);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any stored tokens with expired access but valid refresh, isAuthenticated returns true', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens with expired access but valid refresh
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          // Access token expiry in the past (1 hour to 7 days ago)
          accessExpiry: fc.integer({
            min: Date.now() - 7 * 24 * 60 * 60 * 1000,
            max: Date.now() - 1000,
          }),
          // Refresh token expiry in the future (1 day to 30 days from now)
          refreshExpiry: fc.integer({ min: Date.now() + 86400000, max: Date.now() + 2592000000 }),
        }),
        async (tokens) => {
          // Pre-populate storage with expired access token but valid refresh token
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, tokens.accessExpiry.toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, tokens.refreshExpiry.toString());

          // Configure AuthService (simulating app restart)
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
          });

          // Check authentication state
          const authService = AuthService.getInstance();
          const isAuthenticated = await authService.isAuthenticated();

          // Should be authenticated since refresh token is valid
          expect(isAuthenticated).toBe(true);

          // Auth state should reflect authenticated
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(true);
          expect(authState.requiresReauth).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any stored tokens with both expired, isAuthenticated returns false and signals re-auth required', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens with both expired
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
          // Both expiries in the past
          accessExpiry: fc.integer({
            min: Date.now() - 30 * 24 * 60 * 60 * 1000,
            max: Date.now() - 8 * 24 * 60 * 60 * 1000,
          }),
          refreshExpiry: fc.integer({
            min: Date.now() - 7 * 24 * 60 * 60 * 1000,
            max: Date.now() - 1000,
          }),
        }),
        async (tokens) => {
          // Pre-populate storage with expired tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, tokens.accessExpiry.toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, tokens.refreshExpiry.toString());

          // Configure AuthService (simulating app restart)
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
          });

          // Check authentication state
          const authService = AuthService.getInstance();
          const isAuthenticated = await authService.isAuthenticated();

          // Should not be authenticated since both tokens are expired
          expect(isAuthenticated).toBe(false);

          // Auth state should require re-auth
          const authState = authService.getAuthState();
          expect(authState.isAuthenticated).toBe(false);
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for empty storage, isAuthenticated returns false without requiring re-auth', async () => {
    // Configure AuthService with empty storage
    AuthService.configure({
      apiClient,
      secureStorage: storage,
      deviceId: 'test-device-id',
    });

    // Check authentication state
    const authService = AuthService.getInstance();
    const isAuthenticated = await authService.isAuthenticated();

    // Should not be authenticated
    expect(isAuthenticated).toBe(false);

    // Auth state should indicate unauthenticated but not require re-auth (fresh state)
    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.requiresReauth).toBe(false);
  });
});

// **Feature: mobile-secure-token-storage, Property 10: Offline grace period enforcement**
// **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

describe('Feature: mobile-secure-token-storage, Property 10: Offline grace period enforcement', () => {
  let storage: InMemorySecureStorage;
  let apiClient: MockApiClient;

  beforeEach(() => {
    AuthService.resetInstance();
    storage = new InMemorySecureStorage();
    apiClient = new MockApiClient();
  });

  afterEach(() => {
    AuthService.resetInstance();
  });

  it('for any offline period within 7 days, the cached access token remains usable', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
        }),
        // Generate last online timestamp within grace period (0 to 6.9 days ago)
        fc.integer({ min: 0, max: 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 }), // Up to ~6.96 days
        async (tokens, msAgo) => {
          const now = Date.now();
          const lastOnline = now - msAgo;

          // Pre-populate storage with tokens and last online timestamp
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (now + 86400000).toString()); // Valid for 24h
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (now + 2592000000).toString()); // Valid for 30d
          await storage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, lastOnline.toString());

          // Configure AuthService with 7-day grace period
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
            offlineGracePeriodDays: 7,
          });

          const authService = AuthService.getInstance();

          // Check if within grace period
          const withinGracePeriod = await authService.isWithinOfflineGracePeriod();
          expect(withinGracePeriod).toBe(true);

          // Check offline access
          const { canContinue, reason } = await authService.checkOfflineAccess();
          expect(canContinue).toBe(true);
          expect(reason).toBeUndefined();

          // Should be able to get offline access token
          const offlineToken = await authService.getOfflineAccessToken();
          expect(offlineToken).toBe(tokens.accessToken);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any offline period exceeding 7 days, re-authentication is required', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
        }),
        // Generate last online timestamp beyond grace period (7+ days ago)
        fc.integer({ min: 7 * 24 * 60 * 60 * 1000 + 1000, max: 30 * 24 * 60 * 60 * 1000 }), // 7 to 30 days
        async (tokens, msAgo) => {
          const now = Date.now();
          const lastOnline = now - msAgo;

          // Pre-populate storage with tokens and expired last online timestamp
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (now + 86400000).toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (now + 2592000000).toString());
          await storage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, lastOnline.toString());

          // Configure AuthService with 7-day grace period
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
            offlineGracePeriodDays: 7,
          });

          const authService = AuthService.getInstance();

          // Check if within grace period
          const withinGracePeriod = await authService.isWithinOfflineGracePeriod();
          expect(withinGracePeriod).toBe(false);

          // Check offline access
          const { canContinue, reason } = await authService.checkOfflineAccess();
          expect(canContinue).toBe(false);
          expect(reason).toBe('OfflineGracePeriodExpired');

          // Should not be able to get offline access token
          const offlineToken = await authService.getOfflineAccessToken();
          expect(offlineToken).toBeNull();

          // Auth state should require re-auth
          const authState = authService.getAuthState();
          expect(authState.requiresReauth).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any configurable grace period, the enforcement respects the configured value', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
        }),
        // Generate grace period in days (1 to 14 days)
        fc.integer({ min: 1, max: 14 }),
        // Generate whether we're within or beyond the grace period
        fc.boolean(),
        async (tokens, gracePeriodDays, withinPeriod) => {
          const now = Date.now();
          const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;

          // Calculate last online timestamp based on whether we want to be within or beyond grace period
          const msAgo = withinPeriod
            ? Math.floor(gracePeriodMs * 0.5) // 50% of grace period (within)
            : gracePeriodMs + 1000; // Just beyond grace period

          const lastOnline = now - msAgo;

          // Pre-populate storage
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (now + 86400000).toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (now + 2592000000).toString());
          await storage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, lastOnline.toString());

          // Configure AuthService with custom grace period
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
            offlineGracePeriodDays: gracePeriodDays,
          });

          const authService = AuthService.getInstance();

          // Check if within grace period
          const isWithinGracePeriod = await authService.isWithinOfflineGracePeriod();
          expect(isWithinGracePeriod).toBe(withinPeriod);

          // Check offline access
          const { canContinue } = await authService.checkOfflineAccess();
          expect(canContinue).toBe(withinPeriod);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('updateLastOnlineTimestamp updates the stored timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate tokens
        fc.record({
          accessToken: fc.string({ minLength: 10, maxLength: 500 }),
          refreshToken: fc.string({ minLength: 10, maxLength: 500 }),
        }),
        // Generate old last online timestamp (beyond grace period)
        fc.integer({ min: 8 * 24 * 60 * 60 * 1000, max: 30 * 24 * 60 * 60 * 1000 }),
        async (tokens, msAgo) => {
          const now = Date.now();
          const oldLastOnline = now - msAgo;

          // Pre-populate storage with expired grace period
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (now + 86400000).toString());
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (now + 2592000000).toString());
          await storage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, oldLastOnline.toString());

          // Configure AuthService
          AuthService.configure({
            apiClient,
            secureStorage: storage,
            deviceId: 'test-device-id',
            offlineGracePeriodDays: 7,
          });

          const authService = AuthService.getInstance();

          // Initially should be beyond grace period
          const initialWithinGracePeriod = await authService.isWithinOfflineGracePeriod();
          expect(initialWithinGracePeriod).toBe(false);

          // Update last online timestamp
          await authService.updateLastOnlineTimestamp();

          // Now should be within grace period
          const afterUpdateWithinGracePeriod = await authService.isWithinOfflineGracePeriod();
          expect(afterUpdateWithinGracePeriod).toBe(true);

          // Auth state should no longer be offline
          const authState = authService.getAuthState();
          expect(authState.isOffline).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
