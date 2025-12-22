import type { ApiClientInterface, LoginResponse, RefreshResponse } from '../types';
import { AuthService } from '../auth';
import { STORAGE_KEYS } from '../secure-storage';
import { InMemorySecureStorage } from './helpers/in-memory-storage';

class MockApiClient implements ApiClientInterface {
  private loginResponse: LoginResponse | null = null;
  private refreshResponse: RefreshResponse | null = null;
  private error: (Error & { status?: number }) | null = null;

  setLoginResponse(response: LoginResponse): void {
    this.loginResponse = response;
    this.refreshResponse = null;
    this.error = null;
  }

  setRefreshResponse(response: RefreshResponse): void {
    this.refreshResponse = response;
    this.error = null;
  }

  setNetworkError(): void {
    const err = new Error('Network error: connection failed') as Error;
    this.error = err;
  }

  setUnauthorized(): void {
    const err = new Error('Unauthorized') as Error & { status?: number };
    err.status = 401;
    this.error = err;
  }

  async post<T>(url: string): Promise<T> {
    if (this.error) {
      throw this.error;
    }

    if (url.includes('/login')) {
      if (!this.loginResponse) {
        throw new Error('Login response not set');
      }
      return this.loginResponse as T;
    }

    if (url.includes('/refresh')) {
      if (!this.refreshResponse) {
        throw new Error('Refresh response not set');
      }
      return this.refreshResponse as T;
    }

    throw new Error(`No mock for ${url}`);
  }
}

class DeferredRefreshApiClient implements ApiClientInterface {
  private refreshResponse: RefreshResponse | null = null;
  refreshCallCount = 0;
  private resolveRefresh: Array<(value: RefreshResponse) => void> = [];
  private rejectRefresh: Array<(reason?: unknown) => void> = [];

  setRefreshResponse(response: RefreshResponse): void {
    this.refreshResponse = response;
  }

  resolveRefreshPromise(): void {
    if (!this.refreshResponse || this.resolveRefresh.length === 0) {
      throw new Error('Refresh response or resolver not set');
    }
    this.resolveRefresh.forEach((resolve) => resolve(this.refreshResponse as RefreshResponse));
    this.resolveRefresh = [];
    this.rejectRefresh = [];
  }

  rejectRefreshPromise(error: unknown): void {
    this.rejectRefresh.forEach((reject) => reject(error));
    this.resolveRefresh = [];
    this.rejectRefresh = [];
  }

  async post<T>(url: string): Promise<T> {
    if (url.includes('/refresh')) {
      this.refreshCallCount += 1;
      return new Promise<T>((resolve, reject) => {
        this.resolveRefresh.push((value: RefreshResponse) => resolve(value as T));
        this.rejectRefresh.push(reject);
      });
    }
    throw new Error(`No mock for ${url}`);
  }
}

describe('AuthService unit tests', () => {
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
    jest.restoreAllMocks();
    AuthService.resetInstance();
  });

  it('login stores tokens and updates state on success', async () => {
    const fakeNow = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    apiClient.setLoginResponse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 86400,
    });

    const authService = AuthService.getInstance();
    const result = await authService.login('user@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-token');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-token');

    const accessExpiry = Number(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY));
    const refreshExpiry = Number(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY));
    expect(accessExpiry).toBe(fakeNow + 3600 * 1000);
    expect(refreshExpiry).toBe(fakeNow + 86400 * 1000);
    expect(await storage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP)).toBe(fakeNow.toString());

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.requiresReauth).toBe(false);
  });

  it('login stores expiry timestamps when backend returns ISO expiries', async () => {
    const fakeNow = 1_700_000_100_000;
    const accessExpiry = new Date('2030-01-01T00:00:00.000Z');
    const refreshExpiry = new Date('2030-01-15T12:00:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    apiClient.setLoginResponse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: accessExpiry.toISOString(),
      refreshTokenExpiresAt: refreshExpiry.toISOString(),
    });

    const authService = AuthService.getInstance();
    const result = await authService.login('user@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-token');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-token');
    expect(Number(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY))).toBe(
      accessExpiry.getTime()
    );
    expect(Number(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY))).toBe(
      refreshExpiry.getTime()
    );
    expect(await storage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP)).toBe(fakeNow.toString());
  });

  it('login returns InvalidCredentials error on 401', async () => {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'existing-access');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'existing-refresh');

    apiClient.setUnauthorized();
    const authService = AuthService.getInstance();

    const result = await authService.login('user@example.com', 'bad-password');

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('InvalidCredentials');
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('existing-access');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('existing-refresh');
  });

  it('login returns NetworkError and preserves storage on network failure', async () => {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'cached-access');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'cached-refresh');

    apiClient.setNetworkError();
    const authService = AuthService.getInstance();

    const result = await authService.login('user@example.com', 'password123');

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('NetworkError');
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('cached-access');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('cached-refresh');
  });

  describe('restoreAuthState', () => {
    it('returns unauthenticated when no tokens exist', async () => {
      const authService = AuthService.getInstance();
      const state = await authService.restoreAuthState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.requiresReauth).toBe(false);
      expect(state.isOffline).toBe(false);
    });

    it('returns authenticated when access token is valid', async () => {
      const fakeNow = 1_700_000_200_000;
      jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-access');
      await storage.setItem(
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
        (fakeNow + 120_000).toString() // valid for 2 more minutes
      );
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');
      await storage.setItem(
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
        (fakeNow + 3_600_000).toString() // 1 hour
      );

      const authService = AuthService.getInstance();
      const state = await authService.restoreAuthState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.requiresReauth).toBe(false);
      expect(state.isOffline).toBe(false);
    });

    it('returns authenticated when access expired but refresh is valid', async () => {
      const fakeNow = 1_700_000_300_000;
      jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-access');
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (fakeNow - 1_000).toString());
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (fakeNow + 5 * 60_000).toString());

      const authService = AuthService.getInstance();
      const state = await authService.restoreAuthState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.requiresReauth).toBe(false);
    });

    it('requires reauth when both tokens are expired', async () => {
      const fakeNow = 1_700_000_400_000;
      jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-access');
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh');
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (fakeNow - 10_000).toString());
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (fakeNow - 5_000).toString());

      const authService = AuthService.getInstance();
      const state = await authService.restoreAuthState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.requiresReauth).toBe(true);
      expect(state.isOffline).toBe(false);
    });
  });

  describe('refresh single-flight behavior', () => {
    it('queues concurrent refresh attempts and performs only one refresh call', async () => {
      const fakeNow = 1_700_000_700_000;
      jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

      // Configure a deferred refresh client so we can resolve on demand
      AuthService.resetInstance();
      const deferredClient = new DeferredRefreshApiClient();
      deferredClient.setRefreshResponse({
        accessToken: 'refreshed-token',
        accessTokenExpiresIn: 300,
      });
      AuthService.configure({
        apiClient: deferredClient,
        secureStorage: storage,
        deviceId: 'test-device-id',
      });

      // Seed storage with expired access token and valid refresh token
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');

      const authService = AuthService.getInstance();

      // Fire two concurrent refresh requests
      const refreshPromise1 = authService.refreshAccessToken();
      const refreshPromise2 = authService.refreshAccessToken();

      // Allow the refresh request to be issued and resolver to attach
      await Promise.resolve();

      // Resolve the deferred refresh
      deferredClient.resolveRefreshPromise();

      const [token1, token2] = await Promise.all([refreshPromise1, refreshPromise2]);
      expect(token1).toBe('refreshed-token');
      expect(token2).toBe('refreshed-token');

      // Only one refresh call should have been made
      expect(deferredClient.refreshCallCount).toBe(1);

      // Stored tokens updated with refreshed token and expiry
      expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('refreshed-token');
      expect(Number(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY))).toBe(
        fakeNow + 300_000
      );

      // Auth state updated
      const authState = authService.getAuthState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.requiresReauth).toBe(false);
    });
  });

  it('logout clears all stored tokens and flags re-auth', async () => {
    apiClient.setLoginResponse({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 86400,
    });

    const authService = AuthService.getInstance();
    await authService.login('user@example.com', 'password123');
    await authService.logout();

    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP)).toBeNull();

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.requiresReauth).toBe(true);
  });

  it('getAccessToken returns existing valid token without refreshing', async () => {
    const fakeNow = 1_700_000_800_000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    const authService = AuthService.getInstance();
    const expiry = fakeNow + 120_000;

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'valid-token');
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, expiry.toString());

    const refreshSpy = jest.spyOn(authService, 'refreshAccessToken');
    const token = await authService.getAccessToken();

    expect(token).toBe('valid-token');
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('getAccessToken refreshes expired token and returns new value', async () => {
    const fakeNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (fakeNow - 1000).toString());
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (fakeNow + 10_000).toString());

    apiClient.setRefreshResponse({
      accessToken: 'new-token',
      accessTokenExpiresIn: 120,
    });

    const authService = AuthService.getInstance();
    const token = await authService.getAccessToken();

    expect(token).toBe('new-token');
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('new-token');
    expect(Number(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY))).toBe(fakeNow + 120_000);
  });

  it('getAccessToken returns null when no tokens are stored', async () => {
    const authService = AuthService.getInstance();
    const refreshSpy = jest.spyOn(authService, 'refreshAccessToken');

    const token = await authService.getAccessToken();

    expect(token).toBeNull();
    expect(refreshSpy).not.toHaveBeenCalled();

    const authState = authService.getAuthState();
    expect(authState.requiresReauth).toBe(false);
  });

  it('getAccessToken marks reauth required and clears tokens when refresh fails (401)', async () => {
    const fakeNow = 1_700_000_500_000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (fakeNow - 1_000).toString());
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (fakeNow + 120_000).toString());
    apiClient.setUnauthorized();

    const authService = AuthService.getInstance();
    const token = await authService.getAccessToken();

    expect(token).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();

    const authState = authService.getAuthState();
    expect(authState.requiresReauth).toBe(true);
    expect(authState.isAuthenticated).toBe(false);
  });

  it('getAccessToken preserves tokens but flags offline + reauth when refresh network fails', async () => {
    const fakeNow = 1_700_000_600_000;
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, (fakeNow - 1_000).toString());
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, (fakeNow + 120_000).toString());
    apiClient.setNetworkError();

    const authService = AuthService.getInstance();
    const token = await authService.getAccessToken();

    expect(token).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('expired-token');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-token');

    const authState = authService.getAuthState();
    expect(authState.isOffline).toBe(true);
    expect(authState.requiresReauth).toBe(true);
  });

  it('refreshAccessToken stores new access token on success', async () => {
    const fakeNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'old-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');

    apiClient.setRefreshResponse({
      accessToken: 'refreshed-token',
      accessTokenExpiresIn: 300,
    });

    const authService = AuthService.getInstance();
    const token = await authService.refreshAccessToken();

    expect(token).toBe('refreshed-token');
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('refreshed-token');
    expect(Number(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY))).toBe(fakeNow + 300_000);
    expect(await storage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP)).toBe(fakeNow.toString());

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.requiresReauth).toBe(false);
  });

  it('refreshAccessToken clears tokens and signals re-auth on failure', async () => {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'old-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-token');
    apiClient.setUnauthorized();

    const authService = AuthService.getInstance();
    const token = await authService.refreshAccessToken();

    expect(token).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.requiresReauth).toBe(true);
  });

  it('refreshAccessToken rotates refresh token when provided', async () => {
    const fakeNow = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(fakeNow);

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'old-token');
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'old-refresh-token');

    apiClient.setRefreshResponse({
      accessToken: 'new-access',
      accessTokenExpiresIn: 180,
      refreshToken: 'new-refresh-token',
      refreshTokenExpiresIn: 600,
    });

    const authService = AuthService.getInstance();
    const token = await authService.refreshAccessToken();

    expect(token).toBe('new-access');
    expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh-token');
    expect(Number(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY))).toBe(
      fakeNow + 600_000
    );
  });
});
