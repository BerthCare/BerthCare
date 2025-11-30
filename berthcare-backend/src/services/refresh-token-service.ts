import { createHash, randomUUID } from 'crypto';
import { signRefreshToken } from '../lib/jwt';
import {
  refreshTokenRepository,
  type RefreshTokenRepository,
  type UpsertRefreshTokenInput,
} from '../repositories/refresh-token';

export type RefreshTokenResult = {
  refreshToken: string;
  jti: string;
  expiresAt: Date;
  issuedAt: Date;
};

export class RefreshTokenService {
  constructor(private readonly repo: RefreshTokenRepository = refreshTokenRepository) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createRefreshToken(userId: string, deviceId: string): Promise<RefreshTokenResult> {
    const jti = randomUUID();
    const issuedAt = new Date();
    const { token, expiresAt } = await signRefreshToken(userId, deviceId, jti);

    const payload: UpsertRefreshTokenInput = {
      jti,
      userId,
      deviceId,
      tokenHash: this.hashToken(token),
      issuedAt,
      expiresAt,
    };

    await this.repo.upsertForDevice(payload);

    return {
      refreshToken: token,
      jti,
      expiresAt,
      issuedAt,
    };
  }
}

export const refreshTokenService = new RefreshTokenService();
