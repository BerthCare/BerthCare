import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../index';
import { logger } from '../observability/logger';

describe('logging middleware integration', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp((instance) => {
      instance.get('/boom', () => {
        throw new Error('boom');
      });
    });
  });

  it('logs request metadata and propagates requestId header', async () => {
    const infoMock = jest.spyOn(logger, 'info');

    const response = await request(app)
      .get('/health?foo=bar')
      .set('User-Agent', 'supertest-agent')
      .set('x-request-id', 'req-123');

    await new Promise((resolve) => setImmediate(resolve));
    const infoCalls = infoMock.mock.calls
      .map(([payload]) => payload)
      .filter(
        (payload): payload is Record<string, unknown> => !!payload && typeof payload === 'object'
      );
    infoMock.mockRestore();

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-123');

    const log = infoCalls.find((entry) => entry.event === 'http.request');
    expect(log).toBeDefined();
    if (!log) throw new Error('log not found');
    expect(log).toMatchObject({
      event: 'http.request',
      method: 'GET',
      route: '/health',
      requestId: 'req-123',
      statusCode: 200,
      userAgent: 'supertest-agent',
    });
    expect(log.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('logs errors with stack and request context', async () => {
    const errorMock = jest.spyOn(logger, 'error');

    const response = await request(app).get('/boom').set('x-request-id', 'err-456');

    await new Promise((resolve) => setImmediate(resolve));
    const errorCalls = errorMock.mock.calls
      .map(([payload]) => payload)
      .filter(
        (payload): payload is Record<string, unknown> => !!payload && typeof payload === 'object'
      );
    errorMock.mockRestore();

    expect(response.status).toBe(500);
    expect(response.headers['x-request-id']).toBe('err-456');
    expect(response.body).toMatchObject({
      error: {
        message: 'Internal Server Error',
        requestId: 'err-456',
      },
    });

    const errorLog = errorCalls.find((entry) => entry.event === 'http.error');
    expect(errorLog).toBeDefined();
    expect(errorLog).toMatchObject({
      event: 'http.error',
      requestId: 'err-456',
      method: 'GET',
      route: '/boom',
      statusCode: 500,
    });
    const stack = errorLog?.stack as string;
    expect(typeof stack).toBe('string');
    expect(stack.length).toBeGreaterThan(0);
  });
});
