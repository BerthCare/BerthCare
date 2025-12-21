import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthResponse } from '../../services/auth';

class FakeAuthService {
  async login(): Promise<AuthResponse> {
    return {
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 2000),
      caregiverId: 'cg-1',
    };
  }

  async refresh(): Promise<AuthResponse> {
    return {
      accessToken: 'new-access-token',
      accessTokenExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'new-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 2000),
      caregiverId: 'cg-1',
    };
  }
}

describe('Auth routes', () => {
  let app: Express;

  beforeEach(() => {
    const fakeService = new FakeAuthService() as any;
    app = createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(fakeService));
    });
  });

  it('returns tokens on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'pass', deviceId: 'device-1' })
      .expect(200);

    expect(res.body.accessToken).toBe('access-token');
    expect(res.body.refreshToken).toBe('refresh-token');
  });

  it('returns 400 on missing params', async () => {
    await request(app).post('/api/auth/login').send({ email: 'x' }).expect(400);
  });
});
