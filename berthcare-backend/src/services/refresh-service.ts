import { signAccessToken } from '../lib/jwt';
import { refreshTokenService } from './refresh-token-service';
import { tokenValidationService } from './token-validation-service';
import { refreshTokenRepository } from '../repositories/refresh-token';

export type RefreshInput = {
  token: string;
  deviceId?: string;
  rotate?: boolean;
};

export type RefreshResult = {
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken?: string;
  refreshExpiresAt?: Date;
  jti: string;
  deviceId: string;
  userId: string;
};

export class RefreshError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_TOKEN'
      | 'REVOKED'
      | 'EXPIRED'
      | 'DEVICE_MISMATCH'
      | 'NOT_FOUND'
  ) {
    super(code);
  }
}

export class RefreshService {
  async refresh(input: RefreshInput): Promise<RefreshResult> {
    const { token, deviceId, rotate = false } = input;

    const validation = await tokenValidationService.validateRefreshToken(token, deviceId);

    if (!validation.valid) {
      switch (validation.reason) {
        case 'device-mismatch':
          throw new RefreshError('DEVICE_MISMATCH');
        case 'revoked':
          throw new RefreshError('REVOKED');
        case 'expired':
          throw new RefreshError('EXPIRED');
        case 'not-found':
        default:
          throw new RefreshError('NOT_FOUND');
      }
    }

    const { claims } = validation;

    // touch usage for analytics/rotation gating
    await refreshTokenRepository.touchLastUsed(claims.jti);

    const { token: accessToken, expiresAt: accessExpiresAt } = await signAccessToken(
      claims.sub,
      claims.deviceId
    );

    if (!rotate) {
      return {
        accessToken,
        accessExpiresAt,
        jti: claims.jti,
        deviceId: claims.deviceId,
        userId: claims.sub,
      };
    }

    // rotate: revoke previous and issue new refresh
    const newRefresh = await refreshTokenService.createRefreshToken(claims.sub, claims.deviceId);
    await refreshTokenRepository.markRevoked(claims.jti, new Date(), newRefresh.jti);

    return {
      accessToken,
      accessExpiresAt,
      refreshToken: newRefresh.refreshToken,
      refreshExpiresAt: newRefresh.expiresAt,
      jti: newRefresh.jti,
      deviceId: claims.deviceId,
      userId: claims.sub,
    };
  }
}

export const refreshService = new RefreshService();
