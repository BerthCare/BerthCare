import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthService, LoginResult } from '../../services/auth';
import type { RefreshService } from '../../services/refresh';

class FakeAuthService {
  login(): Promise<LoginResult> {
    return Promise.resolve({
      accessToken: 'access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      userId: 'cg-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });
  }
}

class FakeRefreshService {
  refresh(): Promise<LoginResult> {
    return Promise.resolve({
      accessToken: 'new-access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'new-refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      userId: 'cg-1',
      deviceId: 'device-1',
      jti: 'jti-2',
    });
  }
}

describe('Auth refresh route', () => {
  let app: Express;

  beforeEach(() => {
    const fakeAuth: AuthService = new FakeAuthService();
    const fakeRefresh: RefreshService = new FakeRefreshService();
    app = createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(fakeAuth, fakeRefresh));
    });
  });

  it('returns new tokens on refresh', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret', deviceId: 'device-1' })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.accessToken).toBe('new-access-token');
    expect(body.refreshToken).toBe('new-refresh-token');
  });

  it('rejects missing refreshToken/deviceId', async () => {
    await request(app).post('/api/auth/refresh').send({ deviceId: 'device-1' }).expect(400);
  });
});
