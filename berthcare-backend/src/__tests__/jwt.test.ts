import { randomUUID } from 'crypto';

type JwtHelpers = typeof import('../lib/jwt');

const originalEnv = { ...process.env };

const loadJwtHelpers = async (overrides: Record<string, string | undefined>): Promise<JwtHelpers> => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-secret',
    JWT_ISSUER: 'issuer.example',
    JWT_AUDIENCE: 'audience.example',
    JWT_ACCESS_TTL: '3600',
    JWT_REFRESH_TTL: '7200',
    ...overrides,
  };
  const helpers = await import('../lib/jwt');
  process.env = { ...originalEnv };
  return helpers;
};

afterAll(() => {
  process.env = originalEnv;
});

describe('JWT helpers', () => {
  it('signs and verifies access tokens with expected claims and ttl', async () => {
    const { signAccessToken, verifyAccessToken } = await loadJwtHelpers({});
    const userId = randomUUID();
    const deviceId = randomUUID();

    const { token, expiresAt, claims } = await signAccessToken(userId, deviceId, { role: 'caregiver' });
    expect(token).toBeDefined();
    expect(claims.sub).toBe(userId);
    expect(claims.deviceId).toBe(deviceId);
    expect(claims.role).toBe('caregiver');

    const verified = await verifyAccessToken(token);
    expect(verified.sub).toBe(userId);
    expect(verified.deviceId).toBe(deviceId);

    const ttlSeconds = Math.round((expiresAt.getTime() - Date.now()) / 1000);
    expect(ttlSeconds).toBeGreaterThan(0);
    expect(ttlSeconds).toBeLessThanOrEqual(3600);
  });

  it('signs and verifies refresh tokens with jti and device binding', async () => {
    const { signRefreshToken, verifyRefreshToken } = await loadJwtHelpers({});
    const userId = randomUUID();
    const deviceId = randomUUID();
    const jti = randomUUID();

    const { token, expiresAt, claims } = await signRefreshToken(userId, deviceId, jti);
    expect(claims.jti).toBe(jti);
    expect(claims.deviceId).toBe(deviceId);

    const verified = await verifyRefreshToken(token);
    expect(verified.jti).toBe(jti);
    expect(verified.sub).toBe(userId);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects tokens signed with a different secret', async () => {
    const { signAccessToken } = await loadJwtHelpers({});
    const { verifyAccessToken } = await loadJwtHelpers({ JWT_SECRET: 'different-secret' });

    const { token } = await signAccessToken('user', 'device');
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});
