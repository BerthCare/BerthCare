import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthService, LoginResult } from '../../services/auth';

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

describe('Auth routes', () => {
  let app: Express;

  beforeEach(() => {
    const fakeService: AuthService = new FakeAuthService();
    app = createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(fakeService));
    });
  });

  it('returns tokens on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'pass', deviceId: 'device-1' })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.accessToken).toBe('access-token');
    expect(body.refreshToken).toBe('refresh-token');
  });

  it('returns 400 on missing params', async () => {
    await request(app).post('/api/auth/login').send({ email: 'x' }).expect(400);
  });
});
