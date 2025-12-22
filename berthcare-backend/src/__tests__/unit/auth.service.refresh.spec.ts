import { AuthService } from '../../services/auth';
import type { CaregiverRepository } from '../../repositories/caregiver';
import type { RefreshTokenService } from '../../services/refresh-token';
import type { RefreshService } from '../../services/refresh';

describe('AuthService.refresh', () => {
  const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

  it('delegates refresh and returns rotated tokens', async () => {
    const refreshMock = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      jti: 'jti-1',
      deviceId: DEVICE_ID,
      userId: 'user-1',
    });
    const refreshHandler: RefreshService = {
      refresh: refreshMock,
    } as RefreshService;

    const caregiverRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as CaregiverRepository;

    const refreshTokenService = {
      createRefreshToken: jest.fn(),
    } as unknown as RefreshTokenService;

    const service = new AuthService(caregiverRepo, refreshTokenService, refreshHandler);
    const result = await service.refresh({ token: 'rt-1.secret', deviceId: DEVICE_ID });

    expect(refreshMock).toHaveBeenCalledWith({
      token: 'rt-1.secret',
      deviceId: DEVICE_ID,
      rotate: true,
    });
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      jti: 'jti-1',
      deviceId: DEVICE_ID,
      userId: 'user-1',
    });
    expect(result.accessExpiresAt).toEqual(expect.any(Date));
    expect(result.refreshExpiresAt).toEqual(expect.any(Date));
  });
});
