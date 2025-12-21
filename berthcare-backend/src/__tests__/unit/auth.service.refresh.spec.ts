import { AuthService } from '../../services/auth';
import { auditLogRepository } from '../../repositories/audit-log';
import { hashRefreshSecret } from '../../lib/auth/tokens';

describe.skip('AuthService.refresh', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseCaregiver = {
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
    const store = new Map<string, any>();
    return {
      create: jest.fn(async (data) => {
        const id = `rt-${store.size + 1}`;
        const created = { id, ...data };
        store.set(id, created);
        return created;
      }),
      findById: jest.fn(async (id: string) => store.get(id) ?? null),
      revoke: jest.fn(async (id: string, reason: string) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, status: 'revoked', revocationReason: reason });
      }),
      markRotated: jest.fn(async (id: string) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, status: 'rotated' });
      }),
      touchLastSeen: jest.fn(async (id: string, at: Date) => {
        const existing = store.get(id);
        if (existing) store.set(id, { ...existing, lastSeenAt: at });
      }),
      _store: store,
    };
  };

  it('rotates refresh token and issues new access token', async () => {
    const refreshRepo = buildRefreshRepo();
    const caregiverRepo = {
      findById: jest.fn().mockResolvedValue(baseCaregiver),
      findByEmail: jest.fn(),
    } as any;
    jest.spyOn(auditLogRepository, 'create').mockResolvedValue({} as any);

    const service = new AuthService(caregiverRepo as any, refreshRepo as any);

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
