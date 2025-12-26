import { AuthError, AuthService } from '../../services/auth';
import type { CaregiverRepository } from '../../repositories/caregiver';
import type { RefreshTokenService } from '../../services/refresh-token';
import type { RefreshService } from '../../services/refresh';

describe('AuthService.refresh', () => {
  const DEVICE_ID = '11111111-1111-4111-8111-111111111111';
  const buildService = (refreshHandler: RefreshService): AuthService => {
    const caregiverRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as CaregiverRepository;

    const refreshTokenService = {
      createRefreshToken: jest.fn(),
    } as unknown as RefreshTokenService;

    return new AuthService(caregiverRepo, refreshTokenService, refreshHandler);
  };

  it('delegates refresh and returns rotated tokens', async () => {
    const accessExpiresAt = new Date(Date.now() + 1000);
    const refreshExpiresAt = new Date(Date.now() + 2000);
    const refreshMock = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt,
      refreshToken: 'refresh-token',
      refreshExpiresAt,
      jti: 'jti-1',
      deviceId: DEVICE_ID,
      userId: 'user-1',
    });
    const refreshHandler = {
      refresh: refreshMock,
    } as RefreshService;
    const service = buildService(refreshHandler);
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
    expect(result.accessExpiresAt).toEqual(accessExpiresAt);
    expect(result.refreshExpiresAt).toEqual(refreshExpiresAt);
  });

  it('rejects invalid device id before calling refresh handler', async () => {
    const refreshMock = jest.fn();
    const refreshHandler = {
      refresh: refreshMock,
    } as RefreshService;
    const service = buildService(refreshHandler);

    await expect(
      service.refresh({ token: 'rt-1.secret', deviceId: 'not-a-uuid' })
    ).rejects.toBeInstanceOf(AuthError);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('throws when refresh handler does not return rotated token', async () => {
    const refreshMock = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      jti: 'jti-1',
      deviceId: DEVICE_ID,
      userId: 'user-1',
    });
    const refreshHandler = {
      refresh: refreshMock,
    } as RefreshService;
    const service = buildService(refreshHandler);

    await expect(
      service.refresh({ token: 'rt-1.secret', deviceId: DEVICE_ID })
    ).rejects.toThrow('Refresh did not return rotated token');
  });

  it('propagates errors from refresh handler', async () => {
    const refreshMock = jest.fn().mockRejectedValue(new Error('Refresh handler failure'));
    const refreshHandler = {
      refresh: refreshMock,
    } as RefreshService;
    const service = buildService(refreshHandler);

    await expect(
      service.refresh({ token: 'rt-1.secret', deviceId: DEVICE_ID })
    ).rejects.toThrow('Refresh handler failure');
  });
});
