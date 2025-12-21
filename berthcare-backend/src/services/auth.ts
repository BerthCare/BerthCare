import { randomBytes } from 'crypto';
import type { Caregiver, RefreshTokenStatus } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';
import { auditLogRepository } from '../repositories/audit-log';
import { caregiverRepository } from '../repositories/caregiver';
import { RefreshTokenRepository, refreshTokenRepository } from '../repositories/refresh-token';
import {
  hashRefreshSecret,
  generateRefreshToken,
  signAccessToken,
  offlineGraceExceeded,
} from '../lib/auth/tokens';
import { verifyPassword } from '../lib/auth/passwords';
import { authLogger } from '../observability/auth-logger';

type LoginInput = {
  email: string;
  password: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
};

type RefreshInput = {
  refreshToken: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  caregiverId: string;
};

export class AuthService {
  constructor(
    private readonly caregivers = caregiverRepository,
    private readonly refreshTokens: RefreshTokenRepository = refreshTokenRepository
  ) {}

  private async recordAudit(
    caregiverId: string,
    action: string,
    detail: Record<string, unknown> & { deviceId: string }
  ): Promise<void> {
    await auditLogRepository.create({
      entityType: 'caregiver',
      entityId: caregiverId,
      action,
      actorId: caregiverId,
      actorType: 'caregiver',
      before: Prisma.DbNull,
      after: detail as Prisma.InputJsonValue,
      deviceId: detail.deviceId,
      ipAddress: detail.ipAddress as string | undefined,
      userAgent: detail.userAgent as string | undefined,
    });
  }

  private async getCaregiverOrFail(email: string): Promise<Caregiver> {
    const caregiver = await this.caregivers.findByEmail(email);
    if (!caregiver || !caregiver.isActive) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    if (!caregiver.passwordHash) {
      throw Object.assign(new Error('Credentials not set'), { status: 401 });
    }
    return caregiver;
  }

  private parseRefreshToken(raw: string): { tokenId: string; secret: string } {
    const [tokenId, secret] = raw.split('.');
    if (!tokenId || !secret) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    return { tokenId, secret };
  }

  private assertActiveStatus(status: RefreshTokenStatus): void {
    if (status !== 'active') {
      throw Object.assign(new Error('Refresh token not active'), { status: 401 });
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const caregiver = await this.getCaregiverOrFail(input.email);
    const valid = await verifyPassword(input.password, caregiver.passwordHash);
    if (!valid) {
      await this.recordAudit(caregiver.id, 'auth.login.failure', {
        deviceId: input.deviceId,
        reason: 'invalid_password',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const refreshSecret = generateRefreshToken();
    const salt = randomBytes(16).toString('hex');
    const secretHash = hashRefreshSecret(refreshSecret.secret, salt);

    const refresh = await this.refreshTokens.create({
      caregiver: { connect: { id: caregiver.id } },
      deviceId: input.deviceId,
      secretHash,
      salt,
      expiresAt: refreshSecret.expiresAt,
      lastSeenAt: refreshSecret.lastSeenAt,
      issuedAt: new Date(),
      status: 'active',
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    const access = signAccessToken(caregiver.id, input.deviceId, caregiver.role);

    await this.recordAudit(caregiver.id, 'auth.login.success', {
      deviceId: input.deviceId,
      tokenId: refresh.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    authLogger.info(
      { event: 'auth.login', caregiverId: caregiver.id, deviceId: input.deviceId, tokenId: refresh.id },
      'Login success'
    );

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: `${refresh.id}.${refreshSecret.secret}`,
      refreshTokenExpiresAt: refreshSecret.expiresAt,
      caregiverId: caregiver.id,
    };
  }

  async refresh(input: RefreshInput): Promise<AuthResponse> {
    const { tokenId, secret } = this.parseRefreshToken(input.refreshToken);
    const stored = await this.refreshTokens.findById(tokenId);
    if (!stored) {
      authLogger.warn(
        { event: 'auth.refresh.failure', reason: 'token_not_found', deviceId: input.deviceId },
        'Refresh token not found'
      );
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    this.assertActiveStatus(stored.status);

    const secretHash = hashRefreshSecret(secret, stored.salt);
    if (secretHash !== stored.secretHash) {
      await this.refreshTokens.revoke(stored.id, 'secret_mismatch');
      await this.recordAudit(stored.caregiverId, 'auth.refresh.failure', {
        deviceId: input.deviceId,
        tokenId,
        reason: 'secret_mismatch',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }

    if (stored.deviceId !== input.deviceId) {
      await this.refreshTokens.revoke(stored.id, 'device_mismatch');
      await this.recordAudit(stored.caregiverId, 'auth.refresh.failure', {
        deviceId: input.deviceId,
        tokenId,
        reason: 'device_mismatch',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      throw Object.assign(new Error('Refresh token device mismatch'), { status: 401 });
    }

    if (stored.expiresAt < new Date()) {
      await this.refreshTokens.revoke(stored.id, 'expired');
      await this.recordAudit(stored.caregiverId, 'auth.refresh.failure', {
        deviceId: input.deviceId,
        tokenId,
        reason: 'expired',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      throw Object.assign(new Error('Refresh token expired'), { status: 401 });
    }

    const lastSeen = stored.lastSeenAt ?? stored.issuedAt;
    if (offlineGraceExceeded(lastSeen)) {
      await this.refreshTokens.revoke(stored.id, 'offline_grace_exceeded');
      await this.recordAudit(stored.caregiverId, 'auth.refresh.failure', {
        deviceId: input.deviceId,
        tokenId,
        reason: 'offline_grace_exceeded',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      throw Object.assign(new Error('Offline grace period exceeded'), { status: 401 });
    }

    await this.refreshTokens.touchLastSeen(stored.id, new Date());

    const caregiver = await this.caregivers.findById(stored.caregiverId);
    if (!caregiver || !caregiver.isActive) {
      await this.refreshTokens.revoke(stored.id, 'caregiver_inactive');
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }

    const nextRefresh = generateRefreshToken();
    const salt = randomBytes(16).toString('hex');
    const nextSecretHash = hashRefreshSecret(nextRefresh.secret, salt);

    await this.refreshTokens.markRotated(stored.id);

    const created = await this.refreshTokens.create({
      caregiver: { connect: { id: stored.caregiverId } },
      deviceId: input.deviceId,
      secretHash: nextSecretHash,
      salt,
      status: 'active',
      expiresAt: nextRefresh.expiresAt,
      lastSeenAt: nextRefresh.lastSeenAt,
      issuedAt: new Date(),
      rotatedFrom: { connect: { id: stored.id } },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    const access = signAccessToken(stored.caregiverId, input.deviceId, caregiver.role);

    await this.recordAudit(stored.caregiverId, 'auth.refresh.success', {
      deviceId: input.deviceId,
      tokenId: created.id,
      rotatedFromId: stored.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    authLogger.info(
      {
        event: 'auth.refresh',
        caregiverId: stored.caregiverId,
        deviceId: input.deviceId,
        tokenId: created.id,
        rotatedFromId: stored.id,
      },
      'Refresh success'
    );

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: `${created.id}.${nextRefresh.secret}`,
      refreshTokenExpiresAt: nextRefresh.expiresAt,
      caregiverId: stored.caregiverId,
    };
  }
}

export const authService = new AuthService();
