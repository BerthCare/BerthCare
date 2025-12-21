import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';

class RejectingAuthService {
  async login() {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  async refresh() {
    throw Object.assign(new Error('Refresh token expired'), { status: 401 });
  }
}

describe('Auth misuse protections (integration)', () => {
  let app: Express;

  beforeEach(() => {
    const rejectingService = new RejectingAuthService() as any;
    app = createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(rejectingService));
    });
  });

  it('propagates 401 on login misuse', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'bad', deviceId: 'device-1' })
      .expect(401);
  });

  it('propagates 401 on refresh misuse', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt.bad', deviceId: 'device-1' })
      .expect(401);
  });
});
