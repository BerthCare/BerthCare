import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../index';
import { createAuthRouter } from '../../routes/auth';
import type { AuthHandler, LoginResult } from '../../services/auth';
import { RefreshError, type RefreshService } from '../../services/refresh';
import { FakeAuthService } from '../helpers/fake-services';

const VALID_DEVICE_ID = '11111111-1111-4111-8111-111111111111';

class FakeRefreshService {
  refresh(): Promise<LoginResult> {
    return Promise.resolve({
      accessToken: 'new-access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'new-refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      userId: 'cg-1',
      deviceId: VALID_DEVICE_ID,
      jti: 'jti-2',
    });
  }
}

class RejectingRefreshService {
  constructor(private readonly error: Error) {}

  refresh(): Promise<never> {
    return Promise.reject(this.error);
  }
}

describe('Auth refresh route', () => {
  let app: Express;

  const buildApp = (refreshService: RefreshService = new FakeRefreshService()) => {
    const fakeAuth: AuthHandler = new FakeAuthService();
    return createApp((instance) => {
      instance.use('/api/auth', createAuthRouter(fakeAuth, refreshService));
    });
  };

  beforeEach(() => {
    app = buildApp();
  });

  it('returns new tokens on refresh', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'rt-1.secret',
        deviceId: VALID_DEVICE_ID,
      })
      .expect(200);

    const body = res.body as { accessToken: string; refreshToken: string };
    expect(body.accessToken).toBe('new-access-token');
    expect(body.refreshToken).toBe('new-refresh-token');
  });

  it('rejects missing refreshToken', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ deviceId: VALID_DEVICE_ID })
      .expect(400);
  });

  it('rejects missing deviceId', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret' })
      .expect(400);
  });

  it('rejects invalid deviceId format', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret', deviceId: 'not-a-uuid' })
      .expect(400);
  });

  it('returns 401 for expired refresh token', async () => {
    const expiredApp = buildApp(new RejectingRefreshService(new RefreshError('EXPIRED')));

    await request(expiredApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret', deviceId: VALID_DEVICE_ID })
      .expect(401);
  });

  it('returns 403 for revoked refresh token', async () => {
    const revokedApp = buildApp(new RejectingRefreshService(new RefreshError('REVOKED')));

    await request(revokedApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret', deviceId: VALID_DEVICE_ID })
      .expect(403);
  });

  it('returns 403 for device mismatch', async () => {
    const mismatchApp = buildApp(new RejectingRefreshService(new RefreshError('DEVICE_MISMATCH')));

    await request(mismatchApp)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'rt-1.secret', deviceId: VALID_DEVICE_ID })
      .expect(403);
  });
});
