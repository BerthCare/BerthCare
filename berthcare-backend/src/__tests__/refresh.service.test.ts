import { refreshService, RefreshError } from '../services/refresh-service';
import { tokenValidationService } from '../services/token-validation-service';
import { refreshTokenRepository } from '../repositories/refresh-token';
import { refreshTokenService } from '../services/refresh-token-service';
import { signAccessToken } from '../lib/jwt';

jest.mock('../services/token-validation-service', () => ({
  tokenValidationService: {
    validateRefreshToken: jest.fn(),
  },
}));

jest.mock('../repositories/refresh-token', () => ({
  refreshTokenRepository: {
    touchLastUsed: jest.fn(),
    markRevoked: jest.fn(),
  },
}));

jest.mock('../services/refresh-token-service', () => ({
  refreshTokenService: {
    createRefreshToken: jest.fn(),
  },
}));

jest.mock('../lib/jwt', () => ({
  signAccessToken: jest.fn(),
}));

describe('RefreshService.refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when validation fails', async () => {
    (tokenValidationService.validateRefreshToken as jest.Mock).mockResolvedValue({
      valid: false,
      reason: 'device-mismatch',
    });

    await expect(
      refreshService.refresh({ token: 't', deviceId: 'device-1' })
    ).rejects.toThrow(new RefreshError('DEVICE_MISMATCH'));
  });

  it('returns new access token without rotation when valid', async () => {
    (tokenValidationService.validateRefreshToken as jest.Mock).mockResolvedValue({
      valid: true,
      claims: { sub: 'user-1', deviceId: 'device-1', jti: 'old-jti' },
    });
    (signAccessToken as jest.Mock).mockResolvedValue({
      token: 'access-token',
      expiresAt: new Date('2025-02-01T00:00:00Z'),
    });

    const result = await refreshService.refresh({ token: 't', deviceId: 'device-1' });

    expect(refreshTokenRepository.touchLastUsed).toHaveBeenCalledWith('old-jti');
    expect(result).toEqual({
      accessToken: 'access-token',
      accessExpiresAt: new Date('2025-02-01T00:00:00Z'),
      jti: 'old-jti',
      deviceId: 'device-1',
      userId: 'user-1',
    });
  });

  it('rotates refresh token when rotate=true', async () => {
    (tokenValidationService.validateRefreshToken as jest.Mock).mockResolvedValue({
      valid: true,
      claims: { sub: 'user-1', deviceId: 'device-1', jti: 'old-jti' },
    });
    (signAccessToken as jest.Mock).mockResolvedValue({
      token: 'access-token',
      expiresAt: new Date('2025-02-01T00:00:00Z'),
    });
    (refreshTokenService.createRefreshToken as jest.Mock).mockResolvedValue({
      refreshToken: 'new-refresh',
      expiresAt: new Date('2025-03-01T00:00:00Z'),
      jti: 'new-jti',
    });

    const result = await refreshService.refresh({ token: 't', deviceId: 'device-1', rotate: true });

    expect(refreshTokenRepository.touchLastUsed).toHaveBeenCalledWith('old-jti');
    expect(refreshTokenRepository.markRevoked).toHaveBeenCalledWith('old-jti', expect.any(Date), 'new-jti');
    expect(result).toEqual({
      accessToken: 'access-token',
      accessExpiresAt: new Date('2025-02-01T00:00:00Z'),
      refreshToken: 'new-refresh',
      refreshExpiresAt: new Date('2025-03-01T00:00:00Z'),
      jti: 'new-jti',
      deviceId: 'device-1',
      userId: 'user-1',
    });
  });
});
