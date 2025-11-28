import fc from 'fast-check';
import { ApiClient } from '../api-client';
import { ApiError } from '../api-error';

describe('Feature: mobile-api-client, Property 8: Timeout enforcement', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
    global.fetch = originalFetch as typeof fetch;
  });

  it('aborts and returns TimeoutError when response exceeds configured timeout', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 5, max: 50 }), async (timeoutMs) => {
        const fetchMock = jest.fn((_url, init?: RequestInit) => {
          return new Promise((_, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener('abort', () => reject(new Error('Aborted')));
          });
        });

        // @ts-expect-error: intentional test mock
        global.fetch = fetchMock;

        const client = ApiClient.configure({
          baseUrl: 'https://api.example.com',
          timeoutMs,
          retry: {
            maxRetries: 0,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1,
          },
        });

        const { promise } = client.get('/slow');

        jest.advanceTimersByTime(timeoutMs + 1);

        await expect(promise).rejects.toMatchObject({ type: 'TimeoutError' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 },
    );
  });
});

describe('Feature: mobile-api-client, Property 10: Request cancellation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
    global.fetch = originalFetch as typeof fetch;
  });

  it('aborts request on caller cancellation and returns CancelledError', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 50, max: 500 }), async (delayMs) => {
        const fetchMock = jest.fn((_url, init?: RequestInit) => {
          return new Promise((_resolve, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener('abort', () => reject(new Error('Aborted')));
          });
        });

        // @ts-expect-error: intentional test mock
        global.fetch = fetchMock;

        const client = ApiClient.configure({
          baseUrl: 'https://api.example.com',
          timeoutMs: 10_000,
          retry: {
            maxRetries: 0,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1,
          },
        });

        const handle = client.get('/cancel');

        setTimeout(() => handle.abort(), delayMs);
        jest.advanceTimersByTime(delayMs + 1);

        await expect(handle.promise).rejects.toBeInstanceOf(ApiError);
        await expect(handle.promise).rejects.toMatchObject({ type: 'CancelledError' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 },
    );
  });
});
