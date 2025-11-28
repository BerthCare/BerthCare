import fc from 'fast-check';
import { ApiError } from '../api-error';
import { calculateBackoffDelay, executeWithRetry } from '../retry';

describe('Feature: mobile-api-client, Property 4: Exponential backoff timing', () => {
  it('delay equals min(initialDelay * backoffMultiplier^(attempt-1), maxDelay)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // attempt
        fc.integer({ min: 1, max: 10_000 }), // initialDelayMs
        fc.integer({ min: 1, max: 5 }), // backoffMultiplier
        fc.integer({ min: 1, max: 120_000 }), // maxDelayMs
        (attempt, initialDelayMs, backoffMultiplier, maxDelayMs) => {
          const delay = calculateBackoffDelay(attempt, {
            maxRetries: 5,
            initialDelayMs,
            maxDelayMs,
            backoffMultiplier,
          });

          const expected = Math.min(
            initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
            maxDelayMs,
          );

          expect(delay).toBe(expected);
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Feature: mobile-api-client, Property 5: Retry count limit', () => {
  it('fails after maxRetries + 1 total attempts', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 5 }), async (maxRetries) => {
        let attempts = 0;
        const apiError = new ApiError('NetworkError', 'transient');

        await expect(
          executeWithRetry(
            async () => {
              attempts += 1;
              throw apiError;
            },
            {
              method: 'GET',
              retryConfig: {
                maxRetries,
                initialDelayMs: 0,
                maxDelayMs: 0,
                backoffMultiplier: 1,
              },
            },
          ),
        ).rejects.toBe(apiError);

        expect(attempts).toBe(maxRetries + 1);
      }),
      { numRuns: 30 },
    );
  });
});
