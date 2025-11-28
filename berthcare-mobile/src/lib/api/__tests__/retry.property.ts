import fc from 'fast-check';
import { calculateBackoffDelay } from '../retry';

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
