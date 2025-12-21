import { AuthService } from '../../services/auth';
import type { CaregiverRepository } from '../../repositories/caregiver';
import type { RefreshTokenService } from '../../services/refresh-token';
import { RefreshError, type RefreshService } from '../../services/refresh';

describe('AuthService misuse protections', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-should-be-32-characters-long';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildService = (error: RefreshError) => {
    const refresher: Pick<RefreshService, 'refresh'> = {
      refresh: jest.fn().mockRejectedValue(error),
    };
    const caregiverRepo: Pick<CaregiverRepository, 'findById' | 'findByEmail'> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    const refreshTokenRepo: Pick<RefreshTokenService, 'createRefreshToken'> = {
      createRefreshToken: jest.fn(),
    };
    return { service: new AuthService(caregiverRepo as CaregiverRepository, refreshTokenRepo as RefreshTokenService, refresher as RefreshService), refresher };
  };

  it('rejects device mismatch', async () => {
    const { service } = buildService(new RefreshError('DEVICE_MISMATCH'));

    await expect(
      service.refresh({ token: 'rt-1.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toBeInstanceOf(RefreshError);
    await expect(
      service.refresh({ token: 'rt-1.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toHaveProperty('code', 'DEVICE_MISMATCH');
  });

  it('rejects offline >7 days (expired)', async () => {
    const { service } = buildService(new RefreshError('EXPIRED'));

    await expect(
      service.refresh({ token: 'rt-2.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toBeInstanceOf(RefreshError);
    await expect(
      service.refresh({ token: 'rt-2.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toHaveProperty('code', 'EXPIRED');
  });

  it('rejects expired token', async () => {
    const { service } = buildService(new RefreshError('EXPIRED'));

    await expect(
      service.refresh({ token: 'rt-3.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toBeInstanceOf(RefreshError);
    await expect(
      service.refresh({ token: 'rt-3.secret', deviceId: '11111111-1111-4111-8111-111111111111' })
    ).rejects.toHaveProperty('code', 'EXPIRED');
  });
});
