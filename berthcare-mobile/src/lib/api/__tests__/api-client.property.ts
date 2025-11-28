import fc from 'fast-check';
import { ApiClient } from '../api-client';
import { ApiError } from '../api-error';

jest.setTimeout(15000);

describe('Feature: mobile-api-client, Property 8: Timeout enforcement', () => {
  const originalFetch = global.fetch;

  it('aborts and returns TimeoutError when response exceeds configured timeout', async () => {
    try {
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
          promise.catch(() => {});

          await new Promise((resolve) => setTimeout(resolve, timeoutMs + 10));

          let caught: ApiError | undefined;
          try {
            await promise;
          } catch (error) {
            caught = error as ApiError;
          }

          expect(caught).toBeInstanceOf(ApiError);
          expect(caught?.type).toBe('TimeoutError');
          expect(fetchMock).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 3, interruptAfterTimeLimit: 5000 }
      );
    } finally {
      global.fetch = originalFetch as typeof fetch;
    }
  });
});

describe('Feature: mobile-api-client, Property 10: Request cancellation', () => {
  const originalFetch = global.fetch;

  it('aborts request on caller cancellation and returns CancelledError', async () => {
    try {
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
          handle.promise.catch(() => {});

          setTimeout(() => handle.abort(), delayMs);
          await new Promise((resolve) => setTimeout(resolve, delayMs + 20));

          let caught: ApiError | undefined;
          try {
            await handle.promise;
          } catch (error) {
            caught = error as ApiError;
          }

          expect(caught).toBeInstanceOf(ApiError);
          expect(caught?.type).toBe('CancelledError');
          expect(fetchMock).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 3, interruptAfterTimeLimit: 5000 }
      );
    } finally {
      global.fetch = originalFetch as typeof fetch;
    }
  });
});
