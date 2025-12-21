import type { PrismaClient, RefreshToken } from '../generated/prisma/client.js';
import { prisma } from '../models/index.js';

export type UpsertRefreshTokenInput = {
  jti: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  issuedAt?: Date;
  expiresAt: Date;
};

export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertForDevice(input: UpsertRefreshTokenInput): Promise<RefreshToken> {
    const { jti, userId, deviceId, tokenHash, expiresAt, issuedAt = new Date() } = input;

    return this.prisma.refreshToken.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        id: jti,
        userId,
        deviceId,
        tokenHash,
        issuedAt,
        expiresAt,
      },
      update: {
        id: jti,
        tokenHash,
        issuedAt,
        expiresAt,
        revokedAt: null,
        replacedByJti: null,
        lastUsedAt: null,
      },
    });
  }

  async findValidByJti(jti: string, now = new Date()): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: {
        id: jti,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
  }

  async markRevoked(jti: string, revokedAt = new Date(), replacedByJti?: string): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: jti },
      data: {
        revokedAt,
        ...(replacedByJti !== undefined ? { replacedByJti } : {}),
      },
    });
    return result.count > 0;
  }

  async touchLastUsed(jti: string, lastUsedAt = new Date()): Promise<boolean> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: jti },
      data: { lastUsedAt },
    });
    return result.count > 0;
  }

  async revokeByDevice(userId: string, deviceId: string, revokedAt = new Date()): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, deviceId },
      data: { revokedAt, replacedByJti: null },
    });
    return result.count;
  }

  async revokeAllForUser(userId: string, revokedAt = new Date()): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt, replacedByJti: null },
    });
    return result.count;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository(prisma);
