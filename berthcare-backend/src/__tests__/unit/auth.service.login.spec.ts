import { AuthService } from '../../services/auth';
import { auditLogRepository } from '../../repositories/audit-log';

describe('AuthService.login', () => {
  const JWT_SECRET = 'test-secret';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('issues tokens on valid credentials', async () => {
    const password = 's3cret!';
    const bcrypt = (await import('bcrypt')).default;
    const passwordHash = await bcrypt.hash(password, 10);
    const caregiver = {
      id: 'cg-1',
      email: 'user@example.com',
      name: 'User',
      phone: '123',
      organizationId: 'org',
      role: 'caregiver',
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCaregiverRepo = {
      findByEmail: jest.fn().mockResolvedValue(caregiver),
      findById: jest.fn().mockResolvedValue(caregiver),
    } as any;

    const refreshStore: any[] = [];
    const mockRefreshRepo = {
      create: jest.fn(async (data) => {
        const created = { id: `rt-${refreshStore.length + 1}`, ...data };
        refreshStore.push(created);
        return created;
      }),
      findById: jest.fn(),
      revoke: jest.fn(),
      markRotated: jest.fn(),
      touchLastSeen: jest.fn(),
    } as any;

    jest.spyOn(auditLogRepository, 'create').mockResolvedValueOnce({} as any);

    const service = new AuthService(mockCaregiverRepo, mockRefreshRepo);
    const result = await service.login({
      email: caregiver.email,
      password,
      deviceId: 'device-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toContain('rt-1.');
    expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
    expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    expect(mockRefreshRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caregiver: { connect: { id: caregiver.id } },
        deviceId: 'device-1',
        status: 'active',
      })
    );
  });

  it('rejects invalid password', async () => {
    const bcrypt = (await import('bcrypt')).default;
    const caregiver = {
      id: 'cg-1',
      email: 'user@example.com',
      name: 'User',
      phone: '123',
      organizationId: 'org',
      role: 'caregiver',
      isActive: true,
      passwordHash: await bcrypt.hash('correct', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCaregiverRepo = {
      findByEmail: jest.fn().mockResolvedValue(caregiver),
      findById: jest.fn().mockResolvedValue(caregiver),
    } as any;

    const mockRefreshRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      revoke: jest.fn(),
      markRotated: jest.fn(),
      touchLastSeen: jest.fn(),
    } as any;

    jest.spyOn(auditLogRepository, 'create').mockResolvedValue({} as any);

    const service = new AuthService(mockCaregiverRepo, mockRefreshRepo);

    await expect(
      service.login({ email: caregiver.email, password: 'wrong', deviceId: 'dev' })
    ).rejects.toHaveProperty('status', 401);
    expect(mockRefreshRepo.create).not.toHaveBeenCalled();
  });
});
