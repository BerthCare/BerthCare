import type {
  ApiClientInterface,
  LoginResponse,
  RefreshResponse,
  SecureStorageAdapter,
} from '../types';
import { AuthService } from '../auth';
import { STORAGE_KEYS } from '../secure-storage';

class InMemorySecureStorage implements SecureStorageAdapter {
  private storage = new Map<string, string>();

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
    this.storage.clear();
  }
}

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
    const now = Date.now();
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
    expect(accessExpiry).toBeGreaterThan(now);
    expect(refreshExpiry).toBeGreaterThan(now);

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.requiresReauth).toBe(false);
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

    const authState = authService.getAuthState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.requiresReauth).toBe(true);
  });

  it('getAccessToken returns existing valid token without refreshing', async () => {
    const authService = AuthService.getInstance();
    const expiry = Date.now() + 60_000;

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
