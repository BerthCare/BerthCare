import request from 'supertest';
import { createApp } from '../index';
import { refreshService, RefreshError } from '../services/refresh-service';

jest.mock('../services/refresh-service', () => {
  const actual = jest.requireActual('../services/refresh-service');
  return {
    ...actual,
    refreshService: {
      refresh: jest.fn(),
    },
  };
});

describe('POST /api/auth/refresh', () => {
  const app = createApp();
  const mockedRefreshService = refreshService as jest.Mocked<typeof refreshService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when refreshToken is missing', async () => {
    await request(app).post('/api/auth/refresh').send({}).expect(400);
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
      jti: 'jti-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'token', deviceId: '11111111-1111-4111-8111-111111111111' })
      .expect(200);

    expect(res.body.accessToken).toBe('access-token');
    expect(res.body.accessExpiresAt).toBe('2025-02-01T00:00:00.000Z');
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
