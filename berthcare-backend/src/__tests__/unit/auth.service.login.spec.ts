/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { AuthService } from '../../services/auth';
import { auditLogRepository } from '../../repositories/audit-log';

describe('AuthService.login', () => {
  const JWT_SECRET = 'test-secret';
  const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

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
      createRefreshToken: jest.fn(async () => ({
        refreshToken: `rt-${refreshStore.length + 1}.secret`,
        jti: `rt-${refreshStore.length + 1}`,
        expiresAt: new Date(),
        issuedAt: new Date(),
      })),
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
      deviceId: DEVICE_ID,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toContain('rt-1.');
    expect(result.accessExpiresAt).toBeInstanceOf(Date);
    expect(result.refreshExpiresAt).toBeInstanceOf(Date);
    expect(mockRefreshRepo.createRefreshToken).toHaveBeenCalledWith(caregiver.id, DEVICE_ID);
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
      createRefreshToken: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      revoke: jest.fn(),
      markRotated: jest.fn(),
      touchLastSeen: jest.fn(),
    } as any;

    jest.spyOn(auditLogRepository, 'create').mockResolvedValue({} as any);

    const service = new AuthService(mockCaregiverRepo, mockRefreshRepo);

    await expect(
      service.login({ email: caregiver.email, password: 'wrong', deviceId: DEVICE_ID })
    ).rejects.toThrow('INVALID_CREDENTIALS');
    expect(mockRefreshRepo.createRefreshToken).not.toHaveBeenCalled();
  });
});
