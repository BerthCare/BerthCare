import { createHash } from 'crypto';
import { RefreshTokenService } from '../services/refresh-token-service';
import { signRefreshToken } from '../lib/jwt';

jest.mock('../lib/jwt', () => ({
  signRefreshToken: jest.fn(),
}));

const mockRepo = {
  upsertForDevice: jest.fn(),
};

describe('RefreshTokenService', () => {
  const service = new RefreshTokenService(mockRepo as any);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-02T00:00:00Z'));
    jest.clearAllMocks();
    (signRefreshToken as jest.Mock).mockResolvedValue({
      token: 'opaque-refresh-token',
      expiresAt: new Date('2025-02-01T00:00:00Z'),
      claims: { sub: 'user', deviceId: 'device', jti: 'provided-jti' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates and stores a device-bound refresh token with hashed value', async () => {
    const result = await service.createRefreshToken('user-1', 'device-1');

    expect(signRefreshToken).toHaveBeenCalledWith('user-1', 'device-1', expect.any(String));

    const expectedHash = createHash('sha256').update('opaque-refresh-token').digest('hex');
    expect(mockRepo.upsertForDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deviceId: 'device-1',
        tokenHash: expectedHash,
        jti: expect.any(String),
        issuedAt: new Date('2025-01-02T00:00:00.000Z'),
        expiresAt: new Date('2025-02-01T00:00:00.000Z'),
      })
    );

    expect(result.refreshToken).toBe('opaque-refresh-token');
    expect(result.expiresAt.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(typeof result.jti).toBe('string');
  });
});
