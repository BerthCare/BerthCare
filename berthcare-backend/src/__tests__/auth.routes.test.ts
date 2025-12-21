import type { Express } from 'express';
import request from 'supertest';
import { refreshService, RefreshError } from '../services/refresh';
import { authService, AuthError } from '../services/auth';

jest.mock('../services/refresh', () => {
  const actual = jest.requireActual<typeof import('../services/refresh')>(
    '../services/refresh'
  );
  return {
    ...actual,
    refreshService: {
      refresh: jest.fn(),
    },
  };
});

jest.mock('../services/auth', () => {
  const actual = jest.requireActual<typeof import('../services/auth')>(
    '../services/auth'
  );
  return {
    ...actual,
    authService: {
      login: jest.fn(),
    },
  };
});

let app: Express;
const originalEnv = { ...process.env };

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
  const { createApp } = (await import('../index.js')) as { createApp: () => Express };
  app = createApp();
});

afterAll(() => {
  process.env = { ...originalEnv };
});

describe('POST /api/auth/refresh', () => {
  const mockedRefreshService = refreshService as jest.Mocked<typeof refreshService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when refreshToken is missing', async () => {
    await request(app).post('/api/auth/refresh').send({}).expect(400);
  });

  it('returns 400 when deviceId is missing', async () => {
    await request(app).post('/api/auth/refresh').send({ refreshToken: 'token' }).expect(400);
  });

  it('returns 400 when deviceId is invalid', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token', deviceId: 'not-a-uuid' })
      .expect(400);
  });

  it('returns 200 with new access token', async () => {
    mockedRefreshService.refresh.mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt: new Date('2025-02-01T00:00:00Z'),
      refreshToken: 'new-refresh-token',
      refreshExpiresAt: new Date('2025-03-01T00:00:00Z'),
      jti: 'jti-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token', deviceId: '11111111-1111-4111-8111-111111111111' })
      .expect(200);

    const body = res.body as {
      accessToken: string;
      accessExpiresAt: string;
      refreshToken?: string;
      refreshExpiresAt?: string;
    };
    expect(body.accessToken).toBe('access-token');
    expect(body.accessExpiresAt).toBe('2025-02-01T00:00:00.000Z');
    expect(body.refreshToken).toBe('new-refresh-token');
    expect(body.refreshExpiresAt).toBe('2025-03-01T00:00:00.000Z');
  });

  it('maps RefreshError EXPIRED to 401', async () => {
    mockedRefreshService.refresh.mockRejectedValue(new RefreshError('EXPIRED'));

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token', deviceId: '11111111-1111-4111-8111-111111111111' })
      .expect(401);
  });

  it('maps device mismatch to 403', async () => {
    mockedRefreshService.refresh.mockRejectedValue(new RefreshError('DEVICE_MISMATCH'));

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token', deviceId: '11111111-1111-4111-8111-111111111111' })
      .expect(403);
  });
});

describe('POST /api/auth/login', () => {
  const mockedAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when deviceId is missing or invalid', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(400);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'secret', deviceId: 'not-a-uuid' })
      .expect(400);
  });

  it('returns 401 when credentials are invalid', async () => {
    mockedAuthService.login.mockRejectedValue(new AuthError('INVALID_CREDENTIALS'));

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrong',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(401);
  });

  it('returns 200 with tokens when login succeeds', async () => {
    mockedAuthService.login.mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt: new Date('2025-02-01T00:00:00Z'),
      refreshToken: 'refresh-token',
      refreshExpiresAt: new Date('2025-03-01T00:00:00Z'),
      userId: 'user-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      jti: 'jti-1',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'secret',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(200);

    const body = res.body as {
      accessToken: string;
      refreshToken: string;
      accessExpiresAt: string;
      refreshExpiresAt: string;
    };

    expect(body.accessToken).toBe('access-token');
    expect(body.refreshToken).toBe('refresh-token');
    expect(body.accessExpiresAt).toBe('2025-02-01T00:00:00.000Z');
    expect(body.refreshExpiresAt).toBe('2025-03-01T00:00:00.000Z');
  });
});
