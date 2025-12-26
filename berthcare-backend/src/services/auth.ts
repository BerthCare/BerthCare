import { Prisma } from '../generated/prisma/client';
import { auditLogRepository } from '../repositories/audit-log';
import { caregiverRepository, type CaregiverRepository } from '../repositories/caregiver';
import { signAccessToken } from '../lib/jwt';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../lib/auth/passwords';
import { authLogger } from '../observability/auth-logger';
import { refreshTokenService, type RefreshTokenService } from './refresh-token';
import { refreshService, type RefreshService } from './refresh';

export type LoginInput = {
  email: string;
  password: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
};

export type RefreshInput = {
  token: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
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

export interface AuthHandler {
  login(input: LoginInput): Promise<LoginResult>;
  refresh(input: RefreshInput): Promise<LoginResult>;
}

export class AuthError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_CREDENTIALS'
      | 'INVALID_DEVICE'
      | 'REFRESH_ROTATION_FAILED',
    message: string = code
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

type AuditDetail = Record<string, unknown> & {
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
};

export class AuthService implements AuthHandler {
  constructor(
    private readonly caregivers: CaregiverRepository = caregiverRepository,
    private readonly refreshTokens: RefreshTokenService = refreshTokenService,
    private readonly refreshHandler: RefreshService = refreshService
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private ensureDeviceId(deviceId: string): void {
    if (!isUuid(deviceId)) {
      throw new AuthError('INVALID_DEVICE');
    }
  }

  private async recordAudit(
    caregiverId: string,
    action: string,
    detail: AuditDetail
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await auditLogRepository.create({
        entityType: 'caregiver',
        entityId: caregiverId,
        action,
        actorId: caregiverId,
        actorType: 'caregiver',
        before: Prisma.DbNull,
        after: detail as Prisma.InputJsonValue,
        deviceId: detail.deviceId,
        ipAddress: detail.ipAddress,
        userAgent: detail.userAgent,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      authLogger.warn(
        {
          event: 'auth.audit.failure',
          caregiverId,
          deviceId: detail.deviceId,
          reason,
        },
        'Failed to record auth audit log'
      );
    }
  }

  async login(input: LoginInput): Promise<LoginResult> {
    this.ensureDeviceId(input.deviceId);

    const normalizedEmail = this.normalizeEmail(input.email);
    const caregiver = await this.caregivers.findByEmail(normalizedEmail);

    if (!caregiver || caregiver.isActive === false || !caregiver.passwordHash) {
      // Always run a bcrypt compare to reduce timing-based account enumeration.
      await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
      authLogger.warn(
        {
          event: 'auth.login.failure',
          reason: 'invalid_credentials',
          deviceId: input.deviceId,
        },
        'Login failed'
      );
      throw new AuthError('INVALID_CREDENTIALS');
    }

    const validPassword = await verifyPassword(input.password, caregiver.passwordHash);
    if (!validPassword) {
      await this.recordAudit(caregiver.id, 'auth.login.failure', {
        deviceId: input.deviceId,
        reason: 'invalid_password',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      authLogger.warn(
        {
          event: 'auth.login.failure',
          caregiverId: caregiver.id,
          deviceId: input.deviceId,
          reason: 'invalid_password',
        },
        'Login failed'
      );
      throw new AuthError('INVALID_CREDENTIALS');
    }

    const access = signAccessToken(caregiver.id, input.deviceId, caregiver.role);
    const refresh = await this.refreshTokens.createRefreshToken(caregiver.id, input.deviceId);

    await this.recordAudit(caregiver.id, 'auth.login.success', {
      deviceId: input.deviceId,
      tokenId: refresh.jti,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    authLogger.info(
      {
        event: 'auth.login',
        caregiverId: caregiver.id,
        deviceId: input.deviceId,
        tokenId: refresh.jti,
      },
      'Login success'
    );

    return {
      accessToken: access.token,
      accessExpiresAt: access.expiresAt,
      refreshToken: refresh.refreshToken,
      refreshExpiresAt: refresh.expiresAt,
      userId: caregiver.id,
      deviceId: input.deviceId,
      jti: refresh.jti,
    };
  }

  async refresh(input: RefreshInput): Promise<LoginResult> {
    this.ensureDeviceId(input.deviceId);

    const result = await this.refreshHandler.refresh({
      token: input.token,
      deviceId: input.deviceId,
      rotate: true,
    });

    if (!result.refreshToken || !result.refreshExpiresAt) {
      throw new AuthError(
        'REFRESH_ROTATION_FAILED',
        'Refresh did not return rotated token'
      );
    }

    await this.recordAudit(result.userId, 'auth.refresh.success', {
      deviceId: result.deviceId,
      tokenId: result.jti,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    authLogger.info(
      {
        event: 'auth.refresh',
        caregiverId: result.userId,
        deviceId: result.deviceId,
        tokenId: result.jti,
      },
      'Refresh success'
    );

    return {
      accessToken: result.accessToken,
      accessExpiresAt: result.accessExpiresAt,
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt,
      userId: result.userId,
      deviceId: result.deviceId,
      jti: result.jti,
    };
  }
}

export const authService = new AuthService();
