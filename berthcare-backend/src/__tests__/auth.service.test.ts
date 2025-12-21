/* eslint-disable @typescript-eslint/unbound-method */
import bcrypt from 'bcrypt';
import { AuthService, AuthError } from '../services/auth';
import { caregiverRepository } from '../repositories/caregiver';
import { signAccessToken } from '../lib/jwt';
import { refreshTokenService } from '../services/refresh-token';

jest.mock('../repositories/caregiver', () => ({
  caregiverRepository: {
    findByEmail: jest.fn(),
  },
}));

jest.mock('../lib/jwt', () => ({
  signAccessToken: jest.fn(),
}));

jest.mock('../services/refresh-token', () => ({
  refreshTokenService: {
    createRefreshToken: jest.fn(),
  },
}));

describe('AuthService.login', () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid deviceId', async () => {
    await expect(
      service.login({ email: 'user@example.com', password: 'secret', deviceId: 'not-a-uuid' })
    ).rejects.toThrow(new AuthError('INVALID_DEVICE'));
  });

  it('rejects when user not found', async () => {
    (caregiverRepository.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'secret',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
    ).rejects.toThrow(new AuthError('INVALID_CREDENTIALS'));
  });

  it('rejects when password is incorrect', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    (caregiverRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'caregiver',
      passwordHash: hash,
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong-password',
        deviceId: '11111111-1111-4111-8111-111111111111',
      })
    ).rejects.toThrow(new AuthError('INVALID_CREDENTIALS'));
  });

  it('issues access and refresh tokens when credentials and deviceId are valid', async () => {
    const hash = await bcrypt.hash('correct-password', 4);
    (caregiverRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'caregiver',
      passwordHash: hash,
    });
    (signAccessToken as jest.Mock).mockReturnValue({
      token: 'access-token',
      expiresAt: new Date('2025-02-01T00:00:00Z'),
    });
    (refreshTokenService.createRefreshToken as jest.Mock).mockResolvedValue({
      refreshToken: 'refresh-token',
      expiresAt: new Date('2025-03-01T00:00:00Z'),
      jti: 'jti-1',
    });

    const result = await service.login({
      email: 'USER@example.com',
      password: 'correct-password',
      deviceId: '11111111-1111-4111-8111-111111111111',
    });

    expect(signAccessToken).toHaveBeenCalledWith('user-1', '11111111-1111-4111-8111-111111111111', {
      role: 'caregiver',
    });
    expect(refreshTokenService.createRefreshToken).toHaveBeenCalledWith(
      'user-1',
      '11111111-1111-4111-8111-111111111111'
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      accessExpiresAt: new Date('2025-02-01T00:00:00Z'),
      refreshToken: 'refresh-token',
      refreshExpiresAt: new Date('2025-03-01T00:00:00Z'),
      userId: 'user-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      jti: 'jti-1',
    });
  });
});
