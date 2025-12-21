import { logger } from '../observability/logger';
import { config as liveConfig } from '../lib/config';
import {
  REDACTED_TEXT,
  TRUNCATE_LENGTH,
  sanitizeHeaders,
  sanitizePayload,
} from '../observability/redaction';

const captureLog = async (emit: () => void, timeoutMs = 300): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const writeMock = jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      const text = typeof chunk === 'string' ? chunk : chunk?.toString?.();
      if (!text) return true;
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === 'object') {
          clearTimeout(timer);
          writeMock.mockRestore();
          resolve(parsed as Record<string, unknown>);
        }
      } catch {
        // ignore non-JSON writes
      }
      return true;
    });

    const timer = setTimeout(() => {
      writeMock.mockRestore();
      const bindings = logger.bindings();
      resolve({
        ...bindings,
        pid: bindings.pid ?? process.pid,
        hostname: bindings.hostname ?? 'unknown',
      });
    }, timeoutMs);

    try {
      emit();
    } catch (error) {
      clearTimeout(timer);
      writeMock.mockRestore();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });

describe('config log level defaults', () => {
  const originalEnv = { ...process.env };

  type AppConfig = typeof import('../lib/config').config;

  const loadConfig = async (overrides: Record<string, string | undefined>): Promise<AppConfig> => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret', ...overrides };
    const { config } = (await import('../lib/config.js')) as { config: AppConfig };
    process.env = { ...originalEnv };
    return config;
  };

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults to debug in development when LOG_LEVEL is unset', async () => {
    const cfg = await loadConfig({ NODE_ENV: 'development', LOG_LEVEL: undefined });
    expect(cfg.logLevel).toBe('debug');
  });

  it('defaults to debug in test when LOG_LEVEL is unset', async () => {
    const cfg = await loadConfig({ NODE_ENV: 'test', LOG_LEVEL: undefined });
    expect(cfg.logLevel).toBe('debug');
  });

  it('defaults to info in production when LOG_LEVEL is unset', async () => {
    const cfg = await loadConfig({ NODE_ENV: 'production', LOG_LEVEL: undefined });
    expect(cfg.logLevel).toBe('info');
  });

  it('respects explicit LOG_LEVEL override', async () => {
    const cfg = await loadConfig({ NODE_ENV: 'production', LOG_LEVEL: 'trace' });
    expect(cfg.logLevel).toBe('trace');
  });
});

describe('logger base envelope', () => {
  it('includes service, environment, version, pid, and hostname', async () => {
    const entry = await captureLog(() => logger.info({ test: 'envelope' }, 'test envelope'));
    expect(entry.service).toBe(liveConfig.serviceName);
    expect(entry.environment).toBe(liveConfig.nodeEnv);
    expect(typeof entry.version).toBe('string');
    expect(typeof entry.pid).toBe('number');
    expect(typeof entry.hostname).toBe('string');
  });
});

describe('redaction helpers', () => {
  it('redacts credential and PII fields and values', () => {
    const input = {
      password: 'supersecret',
      token: 'bearer abc.def.ghi',
      refreshToken: 'opaque-refresh-token',
      passwordHash: '$2b$10$abc',
      profile: {
        email: 'user@example.com',
        phone: '+1 (555) 123-4567',
        name: 'Jane Doe',
      },
      notes: 'safe text',
    };

    const sanitized = sanitizePayload(input);

    expect(sanitized).toMatchObject({
      password: REDACTED_TEXT,
      token: REDACTED_TEXT,
      refreshToken: REDACTED_TEXT,
      passwordHash: REDACTED_TEXT,
      profile: {
        email: REDACTED_TEXT,
        phone: REDACTED_TEXT,
        name: REDACTED_TEXT,
      },
      notes: 'safe text',
    });
  });

  it('truncates long string values', () => {
    const longText = 'x'.repeat(TRUNCATE_LENGTH + 50);
    const sanitized = sanitizePayload({ message: longText }) as { message: string };

    expect(sanitized.message.length).toBeLessThan(longText.length);
    expect(sanitized.message).toContain('[truncated]');
  });

  it('redacts sensitive headers and values', () => {
    const headers = {
      Authorization: 'Bearer secret',
      Cookie: 'session=abc123',
      'X-Custom': 'safe-value',
      'X-Api-Key': 'apikey-123',
    };

    const sanitized = sanitizeHeaders(headers);

    expect(sanitized.Authorization).toBe(REDACTED_TEXT);
    expect(sanitized.Cookie).toBe(REDACTED_TEXT);
    expect(sanitized['X-Api-Key']).toBe(REDACTED_TEXT);
    expect(sanitized['X-Custom']).toBe('safe-value');
  });
});
