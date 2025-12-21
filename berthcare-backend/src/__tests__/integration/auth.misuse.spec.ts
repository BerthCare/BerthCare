import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthHandler } from '../../services/auth';
import { RefreshError, type RefreshService } from '../../services/refresh';

const VALID_DEVICE_ID = '11111111-1111-4111-8111-111111111111';

class RejectingAuthService {
  login(): Promise<never> {
    return Promise.reject(Object.assign(new Error('Invalid credentials'), { status: 401 }));
  }
  refresh(): Promise<never> {
    return Promise.reject(Object.assign(new Error('Refresh token expired'), { status: 401 }));
  }
}

class RejectingRefreshService {
  constructor(private readonly error: Error = new RefreshError('EXPIRED')) {}

  refresh(): Promise<never> {
    return Promise.reject(this.error);
  }
}

describe('Auth misuse protections (integration)', () => {
  let app: Express;
  const rejectingService: AuthHandler = new RejectingAuthService();

  const buildApp = (refreshService: RefreshService = new RejectingRefreshService()) =>
    createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(rejectingService, refreshService));
    });

  beforeEach(() => {
    app = buildApp();
  });

  it('propagates 401 on login misuse', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'bad',
        deviceId: VALID_DEVICE_ID,
      })
      .expect(401);
  });

  it('rejects login with invalid deviceId', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'bad',
        deviceId: 'not-a-uuid',
      })
      .expect(400);
  });

  it('propagates 401 on refresh misuse', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt.bad', deviceId: VALID_DEVICE_ID })
      .expect(401);
  });

  it('rejects refresh with invalid deviceId', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt.bad', deviceId: 'not-a-uuid' })
      .expect(400);
  });

  it('propagates 403 on refresh device mismatch', async () => {
    const mismatchApp = buildApp(new RejectingRefreshService(new RefreshError('DEVICE_MISMATCH')));

    await request(mismatchApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt.bad', deviceId: VALID_DEVICE_ID })
      .expect(403);
  });

  it('propagates 401 on refresh token expiration errors', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    const expiredApp = buildApp(new RejectingRefreshService(expiredError));

    const res = await request(expiredApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt.bad', deviceId: VALID_DEVICE_ID })
      .expect(401);

    expect(res.body).toMatchObject({ error: { message: 'Invalid token' } });
  });
});
