import bcrypt from 'bcrypt';
import { signAccessToken } from '../lib/jwt';
import { caregiverRepository } from '../repositories/caregiver';
import { refreshTokenService } from './refresh-token-service';
import { refreshService, type RefreshResult, type RefreshService } from './refresh-service.js';

export type LoginInput = {
  email: string;
  password: string;
  deviceId: string;
};

export type LoginResult = {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
  userId: string;
  deviceId: string;
  jti: string;
};

export class AuthError extends Error {
  constructor(public readonly code: 'INVALID_DEVICE' | 'INVALID_CREDENTIALS') {
    super(code);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export class AuthService {
  constructor(
    private readonly caregivers = caregiverRepository,
    private readonly refreshTokens = refreshTokenService,
    private readonly refresher: RefreshService = refreshService
  ) {}

  async login({ email, password, deviceId }: LoginInput): Promise<LoginResult> {
    if (!deviceId || !isUuid(deviceId)) {
      throw new AuthError('INVALID_DEVICE');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.caregivers.findByEmail(normalizedEmail);

    // Always perform bcrypt compare to prevent timing attacks
    const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm';
    const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

    if (!user || !user.passwordHash || !passwordValid) {
      throw new AuthError('INVALID_CREDENTIALS');
    }

    const { token: accessToken, expiresAt: accessExpiresAt } = signAccessToken(user.id, deviceId, {
      role: user.role,
    });

    const refresh = await this.refreshTokens.createRefreshToken(user.id, deviceId);

    return {
      accessToken,
      accessExpiresAt,
      refreshToken: refresh.refreshToken,
      refreshExpiresAt: refresh.expiresAt,
      userId: user.id,
      deviceId,
      jti: refresh.jti,
    };
  }

  async refresh(input: { token: string; deviceId: string; rotate?: boolean }): Promise<RefreshResult> {
    return this.refresher.refresh(input);
  }
}

export const authService = new AuthService();
