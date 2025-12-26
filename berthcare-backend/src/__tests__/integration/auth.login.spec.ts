import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthHandler } from '../../services/auth';
import { FakeAuthService } from '../helpers/fake-services';

describe('Auth routes', () => {
  let app: Express;

  beforeEach(() => {
    const fakeService: AuthHandler = new FakeAuthService();
    app = createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(fakeService));
    });
  });

  it('returns tokens on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'pass',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.accessToken).toBe('access-token');
    expect(body.refreshToken).toBe('refresh-token');
  });

  it('returns 400 on missing params', async () => {
    await request(app).post('/api/auth/login').send({ email: 'x' }).expect(400);
  });

  it('returns 400 for invalid email format', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: 'pass',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(400);
  });

  it('returns 400 for invalid deviceId format', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'pass',
        deviceId: 'not-a-uuid',
      })
      .expect(400);
  });

  it('returns 400 for missing email', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        password: 'pass',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
      .expect(400);
  });
});
