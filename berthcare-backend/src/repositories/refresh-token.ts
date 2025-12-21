import type { PrismaClient, RefreshToken, Prisma } from '../generated/prisma/client';
import { prisma } from '../models';

export type CreateRefreshTokenInput = Prisma.RefreshTokenCreateInput;

export class RefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({ where: { id } });
  }

  async findActiveById(id: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findFirst({ where: { id, status: 'active' } });
  }

  async markRotated(id: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id },
      data: { status: 'rotated', revokedAt: new Date(), revocationReason: 'rotated' },
    });
  }

  async revoke(id: string, reason: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id },
      data: { status: 'revoked', revokedAt: new Date(), revocationReason: reason },
    });
  }

  async touchLastSeen(id: string, at: Date): Promise<void> {
    await this.db.refreshToken.update({ where: { id }, data: { lastSeenAt: at } });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository(prisma);
