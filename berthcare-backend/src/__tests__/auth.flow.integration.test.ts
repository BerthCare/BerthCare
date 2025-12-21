import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type {
  UpsertRefreshTokenInput,
  RefreshTokenRepository,
} from '../repositories/refresh-token';
import type { RefreshToken } from '../generated/prisma/client';
import type { AuthHandler, LoginResult } from '../services/auth';
import type { RefreshService, RefreshResult } from '../services/refresh';

const deviceId = '11111111-1111-4111-8111-111111111111';

// Pre-computed bcrypt hash for 'correct-password' with 10 rounds
// This avoids regenerating the hash on every findByEmail call
const TEST_PASSWORD_HASH = bcrypt.hashSync('correct-password', 10);

// Shared in-memory refresh token store for mocks
type RefreshRecord = RefreshToken;

const refreshStore = new Map<string, RefreshRecord>();

type SetupResult = {
  authService: AuthHandler;
  refreshService: RefreshService;
  refreshTokenRepository: RefreshTokenRepository;
};

const setup = async (): Promise<SetupResult> => {
  jest.resetModules();
  refreshStore.clear(); // Clear store for test isolation

  process.env.JWT_SECRET = 'integration-secret';
  process.env.JWT_ISSUER = 'berthcare-backend';
  process.env.JWT_AUDIENCE = 'berthcare-mobile';

  jest.doMock('../repositories/caregiver', () => ({
    caregiverRepository: {
      findByEmail: jest.fn((email: string) => {
        if (email.toLowerCase() !== 'user@example.com') return Promise.resolve(null);
        return Promise.resolve({
          id: 'user-1',
          role: 'caregiver',
          passwordHash: TEST_PASSWORD_HASH,
        });
      }),
    },
  }));

  jest.doMock('../repositories/refresh-token', () => {
    type MockRepo = Pick<
      RefreshTokenRepository,
      | 'upsertForDevice'
      | 'findValidByJti'
      | 'markRevoked'
      | 'touchLastUsed'
      | 'revokeByDevice'
      | 'revokeAllForUser'
    >;

    const repo: MockRepo = {
      upsertForDevice: jest.fn((input: UpsertRefreshTokenInput) => {
        const record: RefreshRecord = {
          id: input.jti,
          userId: input.userId,
          deviceId: input.deviceId,
          tokenHash: input.tokenHash,
          issuedAt: input.issuedAt ?? new Date(),
          expiresAt: input.expiresAt,
          revokedAt: null,
          replacedByJti: null,
          lastUsedAt: null,
        };
        refreshStore.set(input.jti, record);
        return Promise.resolve(record);
      }),
      findValidByJti: jest.fn((jti: string) => {
        const rec = refreshStore.get(jti);
        if (!rec || rec.revokedAt || rec.expiresAt < new Date()) return Promise.resolve(null);
        return Promise.resolve(rec);
      }),
      markRevoked: jest.fn((jti: string, revokedAt: Date, replacedByJti?: string) => {
        const rec = refreshStore.get(jti);
        if (!rec) return Promise.resolve(false);
        rec.revokedAt = revokedAt;
        rec.replacedByJti = replacedByJti ?? null;
        return Promise.resolve(true);
      }),
      touchLastUsed: jest.fn((jti: string, lastUsedAt = new Date()) => {
        const rec = refreshStore.get(jti);
        if (!rec) return Promise.resolve(false);
        rec.lastUsedAt = lastUsedAt;
        return Promise.resolve(true);
      }),
      revokeByDevice: jest.fn(() => Promise.resolve(0)),
      revokeAllForUser: jest.fn(() => Promise.resolve(0)),
    };
    return { refreshTokenRepository: repo };
  });

  const authModule = (await import('../services/auth.js')) as { authService: AuthHandler };
  const refreshModule = (await import('../services/refresh.js')) as {
    refreshService: RefreshService;
  };
  const repoModule = (await import('../repositories/refresh-token.js')) as {
    refreshTokenRepository: RefreshTokenRepository;
  };

  return {
    authService: authModule.authService,
    refreshService: refreshModule.refreshService,
    refreshTokenRepository: repoModule.refreshTokenRepository,
  };
};

describe('Auth flow integration', () => {
  it('issues tokens on login and allows refresh with device binding enforced', async () => {
    const { authService, refreshService, refreshTokenRepository } = await setup();

    const login: LoginResult = await authService.login({
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

    const refreshed: RefreshResult = await refreshService.refresh({
      token: login.refreshToken,
      deviceId,
      rotate: true,
    });

    expect(refreshed.userId).toBe('user-1');
    expect(refreshed.deviceId).toBe(deviceId);
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.accessToken).toBeDefined();

    // Verify old token was revoked
    const oldToken = await refreshTokenRepository.findValidByJti(login.jti);
    expect(oldToken).toBeNull(); // Should be null because it's revoked
  });
});
