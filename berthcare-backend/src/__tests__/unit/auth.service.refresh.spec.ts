import { AuthService } from '../../services/auth';
import { auditLogRepository } from '../../repositories/audit-log';
import { hashRefreshSecret } from '../../lib/auth/tokens';
import type { AuditLog, Caregiver } from '../../generated/prisma/client';
import type { CaregiverRepository } from '../../repositories/caregiver';
import type { RefreshTokenRepository } from '../../repositories/refresh-token';

type RefreshTokenStatus = 'active' | 'rotated' | 'revoked';

type RefreshTokenCreateInput = {
  caregiver: { connect: { id: string } };
  deviceId: string;
  secretHash: string;
  salt: string;
  status: RefreshTokenStatus;
  expiresAt: Date;
  issuedAt: Date;
  lastSeenAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  rotatedFrom?: { connect: { id: string } };
};

type RefreshTokenRecord = {
  id: string;
  caregiverId: string;
  deviceId: string;
  secretHash: string;
  salt: string;
  status: RefreshTokenStatus;
  expiresAt: Date;
  issuedAt: Date;
  lastSeenAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  rotatedFromId?: string;
  revocationReason?: string;
};

describe.skip('AuthService.refresh', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseCaregiver: Caregiver = {
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

  const buildRefreshRepo = () => {
    const store = new Map<string, RefreshTokenRecord>();
    return {
      create: jest.fn<Promise<RefreshTokenRecord>, [RefreshTokenCreateInput]>((data) => {
        const id = `rt-${store.size + 1}`;
        const created: RefreshTokenRecord = {
          id,
          caregiverId: data.caregiver.connect.id,
          deviceId: data.deviceId,
          secretHash: data.secretHash,
          salt: data.salt,
          status: data.status,
          expiresAt: data.expiresAt,
          issuedAt: data.issuedAt,
          lastSeenAt: data.lastSeenAt,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          rotatedFromId: data.rotatedFrom?.connect.id,
        };
        store.set(id, created);
        return Promise.resolve(created);
      }),
      findById: jest.fn<Promise<RefreshTokenRecord | null>, [string]>((id) =>
        Promise.resolve(store.get(id) ?? null)
      ),
      revoke: jest.fn<Promise<void>, [string, string]>((id, reason) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, status: 'revoked', revocationReason: reason });
        return Promise.resolve();
      }),
      markRotated: jest.fn<Promise<void>, [string]>((id) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, status: 'rotated' });
        return Promise.resolve();
      }),
      touchLastSeen: jest.fn<Promise<void>, [string, Date]>((id, at) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, lastSeenAt: at });
        return Promise.resolve();
      }),
      _store: store,
    };
  };

  it('rotates refresh token and issues new access token', async () => {
    const refreshRepo = buildRefreshRepo();
    const caregiverRepo = {
      findById: jest.fn<Promise<Caregiver | null>, [string]>().mockResolvedValue(baseCaregiver),
      findByEmail: jest.fn<Promise<Caregiver | null>, [string]>(),
    };
    jest.spyOn(auditLogRepository, 'create').mockResolvedValue({} as AuditLog);

    const service = new AuthService(
      caregiverRepo as unknown as CaregiverRepository,
      refreshRepo as unknown as RefreshTokenRepository
    );

    // seed existing refresh token
    const salt = 'salt';
    const secret = 'secret';
    const secretHash = hashRefreshSecret(secret, salt);
    refreshRepo._store.set('rt-1', {
      id: 'rt-1',
      caregiverId: baseCaregiver.id,
      deviceId: 'device-1',
      secretHash,
      salt,
      status: 'active',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      issuedAt: new Date(Date.now() - 1000),
      lastSeenAt: new Date(),
    });

    const result = await service.refresh({
      token: 'rt-1.secret',
      deviceId: 'device-1',
      rotate: true,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeDefined();
  });
});
