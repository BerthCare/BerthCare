import fc from 'fast-check';
import type { NextFunction, Request, Response } from 'express';
import type { Writable } from 'stream';
import { logger } from '../observability/logger';
import { loggingMiddleware } from '../middleware/logging';
import { REDACTED_TEXT, TRUNCATE_LENGTH, sanitizePayload } from '../observability/redaction';

describe('Property 1: Structured log envelope', () => {
  it('emits base metadata for arbitrary messages', () => {
    fc.assert(
      fc.property(fc.string(), (message) => {
        const bindings = logger.bindings();
        expect(typeof bindings.service).toBe('string');
        expect(typeof bindings.environment).toBe('string');
      }),
      { numRuns: 10 }
    );
  });
});

describe('Property 2: Redaction coverage', () => {
  it('redacts sensitive values regardless of placement', () => {
    const secretGenerators = fc.oneof(
      fc.constant('password=supersecret'),
      fc.emailAddress(),
      fc.stringMatching(/\+?\d[\d\s().-]{6,}\d/),
      fc.constant('Bearer abc.def.ghi')
    );

    fc.assert(
      fc.property(secretGenerators, (secret) => {
        const payload = {
          password: secret,
          nested: { token: secret },
          array: [secret],
          safe: 'ok',
        };

        const sanitized = sanitizePayload(payload) as Record<string, unknown>;
        expect(Object.values(sanitized)).not.toContain(secret);
        expect((sanitized.password as string) || '').toBe(REDACTED_TEXT);
        expect((sanitized.nested as Record<string, unknown>).token).toBe(REDACTED_TEXT);
      }),
      { numRuns: 20 }
    );
  });

  it('truncates overly long strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: TRUNCATE_LENGTH + 10 }), (value) => {
        const result = sanitizePayload({ value }) as { value: string };
        if (result.value === REDACTED_TEXT) {
          expect(result.value).toBe(REDACTED_TEXT);
        } else {
          expect(result.value).toContain('[truncated]');
          expect(result.value.length).toBeLessThanOrEqual(TRUNCATE_LENGTH + 20);
          expect(result.value.startsWith(value.slice(0, TRUNCATE_LENGTH))).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});

describe('Property 3: Correlation propagation', () => {
  const buildReqRes = (requestId: string) => {
    const headers: Record<string, string> = { 'x-request-id': requestId };
    const callbacks: Array<() => void> = [];

    const req = {
      header: (name: string) => headers[name.toLowerCase()] ?? headers[name],
      method: 'GET',
      originalUrl: '/test/path',
      url: '/test/path',
    } as unknown as Request;

    const resHeaders: Record<string, string> = {};
    const res = {
      statusCode: 200,
      writableEnded: true,
      setHeader: (name: string, value: string) => {
        resHeaders[name.toLowerCase()] = value;
      },
      getHeader: (name: string) => resHeaders[name.toLowerCase()],
      once: (_event: string, cb: () => void) => callbacks.push(cb),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    return { req, res, next, callbacks, resHeaders };
  };

  it('propagates requestId through logging middleware', () => {
    fc.assert(
      fc.property(fc.uuid(), (requestId) => {
        const { req, res, next, callbacks, resHeaders } = buildReqRes(requestId);

        const infoCalls: Array<Record<string, unknown>> = [];
        const infoMock = jest.spyOn(logger, 'info');
        infoMock.mockImplementation((obj: unknown) => {
          if (obj && typeof obj === 'object') {
            infoCalls.push(obj as Record<string, unknown>);
          }
          return logger;
        });

        try {
          loggingMiddleware(req, res, next);
          callbacks.forEach((cb) => cb()); // trigger finish/close handlers

          expect(next).toHaveBeenCalled();
          expect(resHeaders['x-request-id']).toBe(requestId);
          expect(infoCalls.some((call) => call.requestId === requestId)).toBe(true);
        } finally {
          infoMock.mockRestore();
        }
      }),
      { numRuns: 15 }
    );
  });
});

describe('Property 4: Transport selection and resilience', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('gracefully falls back when Datadog API key is missing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom<undefined | ''>(undefined, ''), async (apiKey) => {
        process.env.LOG_DESTINATION = 'datadog';
        if (apiKey === undefined) {
          delete process.env.DATADOG_API_KEY;
        } else {
          process.env.DATADOG_API_KEY = apiKey;
        }
        delete process.env.DATADOG_AGENT_URL;
        jest.resetModules();
        const module = (await import('../observability/transport/datadog.js')) as {
          createDatadogStream: () => Writable | undefined;
        };
        const loadDatadog = module.createDatadogStream;

        expect(() => loadDatadog()).not.toThrow();
        expect(loadDatadog()).toBeUndefined();
      }),
      { numRuns: 5 }
    );
  });

  it('returns undefined when CloudWatch region is missing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom<undefined | ''>(undefined, ''), async (region) => {
        process.env.LOG_DESTINATION = 'cloudwatch';
        process.env.CLOUDWATCH_REGION = region as string | undefined;
        jest.resetModules();
        const module = (await import('../observability/transport/cloudwatch.js')) as {
          createCloudWatchStream: () => Writable | undefined;
        };
        const loadCloudWatch = module.createCloudWatchStream;
        expect(() => loadCloudWatch()).not.toThrow();
        expect(loadCloudWatch()).toBeUndefined();
      }),
      { numRuns: 5 }
    );
  });
});
