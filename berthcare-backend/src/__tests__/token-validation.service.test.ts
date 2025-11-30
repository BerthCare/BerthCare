import { TokenValidationService } from '../services/token-validation-service';
import { verifyAccessToken, verifyRefreshToken } from '../lib/jwt';
import { refreshTokenRepository } from '../repositories/refresh-token';

jest.mock('../lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../repositories/refresh-token', () => ({
  refreshTokenRepository: {
    findValidByJti: jest.fn(),
  },
}));

describe('TokenValidationService', () => {
  const service = new TokenValidationService();
  const now = new Date('2025-01-02T00:00:00Z');
  const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<
    typeof verifyAccessToken
  >;
  const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<
    typeof verifyRefreshToken
  >;
  const mockedRefreshTokenRepo = refreshTokenRepository as jest.Mocked<
    typeof refreshTokenRepository
  >;
  const baseRecord = {
    id: 'jti-1',
    userId: 'user-1',
    deviceId: 'device-1',
    tokenHash: 'hash',
    issuedAt: now,
    expiresAt: new Date(now.getTime() + 86_400_000),
    lastUsedAt: null,
    revokedAt: null,
    replacedByJti: null,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('validates access tokens via signature/claims', async () => {
    mockedVerifyAccessToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
    });

    const result = await service.validateAccessToken('access-token');

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.claims.sub).toBe('user-1');
    }
    expect(verifyAccessToken).toHaveBeenCalledWith('access-token');
  });

  it('rejects refresh token when deviceId mismatches', async () => {
    mockedVerifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });

    const result = await service.validateRefreshToken('token', 'other-device');

    expect(result).toEqual({ valid: false, reason: 'device-mismatch' });
    expect(verifyRefreshToken).toHaveBeenCalledWith('token');
  });

  it('rejects refresh token when not found', async () => {
    mockedVerifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });
    mockedRefreshTokenRepo.findValidByJti.mockResolvedValue(null);

    const result = await service.validateRefreshToken('token');

    expect(result).toEqual({ valid: false, reason: 'not-found' });
  });

  it('rejects refresh token when revoked', async () => {
    mockedVerifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });
    mockedRefreshTokenRepo.findValidByJti.mockResolvedValue({
      ...baseRecord,
      revokedAt: new Date(),
    });

    const result = await service.validateRefreshToken('token');

    expect(result).toEqual({ valid: false, reason: 'revoked' });
  });

  it('rejects refresh token when expired', async () => {
    mockedVerifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });
    mockedRefreshTokenRepo.findValidByJti.mockResolvedValue({
      ...baseRecord,
      revokedAt: null,
      expiresAt: new Date('2024-12-31T23:59:59Z'),
    });

    const result = await service.validateRefreshToken('token');

    expect(result).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects refresh token on verification error (tampered signature)', async () => {
    mockedVerifyRefreshToken.mockRejectedValue(new Error('invalid signature'));

    await expect(service.validateRefreshToken('token', 'device-1')).rejects.toThrow(
      'invalid signature'
    );
  });

  it('accepts valid refresh token when not revoked/expired and device matches', async () => {
    mockedVerifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      deviceId: 'device-1',
      jti: 'jti-1',
    });
    mockedRefreshTokenRepo.findValidByJti.mockResolvedValue({
      ...baseRecord,
      revokedAt: null,
      expiresAt: new Date('2025-01-03T00:00:00Z'),
    });

    const result = await service.validateRefreshToken('token', 'device-1');

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.claims.deviceId).toBe('device-1');
    }
  });
});
