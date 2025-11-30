import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const deviceId = '11111111-1111-4111-8111-111111111111';

// Shared in-memory refresh token store for mocks
const refreshStore = new Map<
  string,
  {
    userId: string;
    deviceId: string;
    tokenHash: string;
    issuedAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByJti: string | null;
    lastUsedAt: Date | null;
  }
>();

const setup = async () => {
  jest.resetModules();

  process.env.JWT_SECRET = 'integration-secret';
  process.env.JWT_ISSUER = 'berthcare-backend';
  process.env.JWT_AUDIENCE = 'berthcare-mobile';

  jest.doMock('../repositories/caregiver', () => ({
    caregiverRepository: {
      findByEmail: jest.fn(async (email: string) => {
        if (email.toLowerCase() !== 'user@example.com') return null;
        const passwordHash = await bcrypt.hash('correct-password', 10);
        return {
          id: 'user-1',
          role: 'caregiver',
          passwordHash,
        };
      }),
    },
  }));

  jest.doMock('../repositories/refresh-token', () => ({
    refreshTokenRepository: {
      upsertForDevice: jest.fn(async (input: any) => {
        refreshStore.set(input.jti, {
          userId: input.userId,
          deviceId: input.deviceId,
          tokenHash: input.tokenHash,
          issuedAt: input.issuedAt,
          expiresAt: input.expiresAt,
          revokedAt: null,
          replacedByJti: null,
          lastUsedAt: null,
        });
        return refreshStore.get(input.jti);
      }),
      findValidByJti: jest.fn(async (jti: string) => refreshStore.get(jti) ?? null),
      markRevoked: jest.fn(async (jti: string, revokedAt: Date, replacedByJti?: string) => {
        const rec = refreshStore.get(jti);
        if (!rec) return false;
        rec.revokedAt = revokedAt;
        rec.replacedByJti = replacedByJti ?? null;
        return true;
      }),
      touchLastUsed: jest.fn(async (jti: string, lastUsedAt = new Date()) => {
        const rec = refreshStore.get(jti);
        if (!rec) return false;
        rec.lastUsedAt = lastUsedAt;
        return true;
      }),
      revokeByDevice: jest.fn(),
      revokeAllForUser: jest.fn(),
    },
  }));

  const { authService } = await import('../services/auth-service');
  const { refreshService } = await import('../services/refresh-service');
  const { refreshTokenRepository } = await import('../repositories/refresh-token');

  return { authService, refreshService, refreshTokenRepository };
};

describe('Auth flow integration', () => {
  beforeEach(() => {
    refreshStore.clear();
  });

  it('issues tokens on login and allows refresh with device binding enforced', async () => {
    const { authService, refreshService, refreshTokenRepository } = await setup();

    const login = await authService.login({
      email: 'USER@example.com',
      password: 'correct-password',
      deviceId,
    });

    const accessPayload = jwt.verify(login.accessToken, process.env.JWT_SECRET!) as jwt.JwtPayload;
    expect(accessPayload.sub).toBe('user-1');
    expect(accessPayload.deviceId).toBe(deviceId);
    // Expiration roughly 24h from now
    const ttlSeconds = (new Date(login.accessExpiresAt).getTime() - Date.now()) / 1000;
    expect(ttlSeconds).toBeGreaterThan(60 * 60 * 20);
    expect(ttlSeconds).toBeLessThan(60 * 60 * 26);

    const stored = await refreshTokenRepository.findValidByJti(login.jti);
    expect(stored?.deviceId).toBe(deviceId);
    expect(stored?.userId).toBe('user-1');

    const refreshed = await refreshService.refresh({
      token: login.refreshToken,
      deviceId,
      rotate: true,
    });

    expect(refreshed.userId).toBe('user-1');
    expect(refreshed.deviceId).toBe(deviceId);
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.accessToken).toBeDefined();
  });
});
