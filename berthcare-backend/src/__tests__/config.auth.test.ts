type AppConfig = typeof import('../lib/config').config;

const DEFAULT_ACCESS_TTL = 60 * 60 * 24;
const DEFAULT_REFRESH_TTL = 60 * 60 * 24 * 30;
const DEFAULT_BCRYPT_ROUNDS = 10;

const originalEnv = { ...process.env };

const loadConfig = async (overrides: Record<string, string | undefined>): Promise<AppConfig> => {
  jest.resetModules();
  process.env = { ...originalEnv, ...overrides };
  const { config } = (await import('../lib/config.js')) as { config: AppConfig };
  process.env = { ...originalEnv };
  return config;
};

afterAll(() => {
  process.env = originalEnv;
});

describe('auth config scaffolding', () => {
  it('loads defaults for TTLs and bcrypt rounds', async () => {
    const cfg = await loadConfig({});

    expect(cfg.jwtAccessTtlSeconds).toBe(DEFAULT_ACCESS_TTL);
    expect(cfg.jwtRefreshTtlSeconds).toBe(DEFAULT_REFRESH_TTL);
    expect(cfg.bcryptSaltRounds).toBe(DEFAULT_BCRYPT_ROUNDS);
  });

  it('overrides auth fields from environment variables when valid', async () => {
    const cfg = await loadConfig({
      JWT_SECRET: 'super-secret',
      JWT_ISSUER: 'issuer.example',
      JWT_AUDIENCE: 'mobile-app',
      JWT_ACCESS_TTL: '900',
      JWT_REFRESH_TTL: '604800',
      BCRYPT_SALT_ROUNDS: '12',
    });

    expect(cfg.jwtSecret).toBe('super-secret');
    expect(cfg.jwtIssuer).toBe('issuer.example');
    expect(cfg.jwtAudience).toBe('mobile-app');
    expect(cfg.jwtAccessTtlSeconds).toBe(900);
    expect(cfg.jwtRefreshTtlSeconds).toBe(604800);
    expect(cfg.bcryptSaltRounds).toBe(12);
  });

  it('falls back to defaults when numeric env values are missing or invalid', async () => {
    const cfg = await loadConfig({
      JWT_ACCESS_TTL: 'not-a-number',
      JWT_REFRESH_TTL: '-1',
      BCRYPT_SALT_ROUNDS: '0',
    });

    expect(cfg.jwtAccessTtlSeconds).toBe(DEFAULT_ACCESS_TTL);
    expect(cfg.jwtRefreshTtlSeconds).toBe(DEFAULT_REFRESH_TTL);
    expect(cfg.bcryptSaltRounds).toBe(DEFAULT_BCRYPT_ROUNDS);
  });
});
