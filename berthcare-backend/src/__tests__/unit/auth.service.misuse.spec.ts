/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { AuthService } from '../../services/auth';
import { hashRefreshSecret } from '../../lib/auth/tokens';
import { auditLogRepository } from '../../repositories/audit-log';

describe.skip('AuthService misuse protections', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const caregiver = {
    id: 'cg-1',
    email: 'user@example.com',
    name: 'User',
    phone: '123',
    organizationId: 'org',
    role: 'caregiver',
    isActive: true,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const buildRefresh = (overrides: Partial<any> = {}) => {
    const salt = overrides.salt ?? 'salt';
    const secret = overrides.secret ?? 'secret';
    return {
      id: overrides.id ?? 'rt-1',
      caregiverId: caregiver.id,
      deviceId: overrides.deviceId ?? 'device-1',
      salt,
      secretHash: hashRefreshSecret(secret, salt),
      status: overrides.status ?? 'active',
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 1_000_000),
      issuedAt: overrides.issuedAt ?? new Date(Date.now() - 1000),
      lastSeenAt: overrides.lastSeenAt ?? new Date(),
      revocationReason: overrides.revocationReason,
    };
  };

  const buildService = (refreshRecord: any) => {
    const refreshRepo = {
      findById: jest.fn().mockResolvedValue(refreshRecord),
      revoke: jest.fn().mockResolvedValue(undefined),
      markRotated: jest.fn(),
      touchLastSeen: jest.fn(),
      create: jest.fn(),
    } as any;
    const caregiverRepo = {
      findById: jest.fn().mockResolvedValue(caregiver),
      findByEmail: jest.fn(),
    } as any;
    jest.spyOn(auditLogRepository, 'create').mockResolvedValue({} as any);
    return { service: new AuthService(caregiverRepo, refreshRepo), refreshRepo };
  };

  it('rejects device mismatch', async () => {
    const refresh = buildRefresh({ deviceId: 'other-device' });
    const { service } = buildService(refresh);

    await expect(
      service.refresh({ token: `${refresh.id}.secret`, deviceId: 'device-1' })
    ).rejects.toHaveProperty('status', 401);
  });

  it('rejects offline >7 days', async () => {
    const refresh = buildRefresh({
      lastSeenAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    const { service } = buildService(refresh);

    await expect(
      service.refresh({ token: `${refresh.id}.secret`, deviceId: 'device-1' })
    ).rejects.toHaveProperty('status', 401);
  });

  it('rejects expired token', async () => {
    const refresh = buildRefresh({ expiresAt: new Date(Date.now() - 1000) });
    const { service } = buildService(refresh);

    await expect(
      service.refresh({ token: `${refresh.id}.secret`, deviceId: 'device-1' })
    ).rejects.toHaveProperty('status', 401);
  });
});
