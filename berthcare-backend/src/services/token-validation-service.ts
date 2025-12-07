import {
  verifyAccessToken,
  verifyRefreshToken,
  type AccessClaims,
  type RefreshClaims,
} from '../lib/jwt';
import { refreshTokenRepository } from '../repositories/refresh-token';

export type AccessTokenValidationResult =
  | {
      valid: true;
      claims: AccessClaims;
    }
  | {
      valid: false;
      reason: 'invalid' | 'expired';
    };

export type RefreshTokenValidationResult =
  | { valid: true; claims: RefreshClaims }
  | { valid: false; reason: 'revoked' | 'expired' | 'not-found' | 'device-mismatch' };

export class TokenValidationService {
  async validateAccessToken(token: string): Promise<AccessTokenValidationResult> {
    try {
      const claims = await verifyAccessToken(token);
      return { valid: true, claims };
    } catch (err) {
      const name = (err as Error).name;
      if (name === 'TokenExpiredError') {
        return { valid: false, reason: 'expired' };
      }
      return { valid: false, reason: 'invalid' };
    }
  }

  async validateRefreshToken(
    token: string,
    deviceId?: string
  ): Promise<RefreshTokenValidationResult> {
    const claims = await verifyRefreshToken(token);

    if (deviceId && claims.deviceId !== deviceId) {
      return { valid: false, reason: 'device-mismatch' };
    }

    const record = await refreshTokenRepository.findValidByJti(claims.jti);

    if (!record) {
      return { valid: false, reason: 'not-found' };
    }

    if (record.revokedAt) {
      return { valid: false, reason: 'revoked' };
    }

    if (record.expiresAt <= new Date()) {
      return { valid: false, reason: 'expired' };
    }

    return { valid: true, claims };
  }
}

export const tokenValidationService = new TokenValidationService();
