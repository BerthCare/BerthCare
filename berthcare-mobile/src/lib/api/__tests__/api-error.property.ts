import fc from 'fast-check';
import { ApiError, resolveApiErrorType } from '../api-error';
import type { ApiErrorType } from '../types';

const retryableTypes: ApiErrorType[] = [
  'NetworkError',
  'TimeoutError',
  'AuthenticationError',
  'ServerError',
];
const nonRetryableTypes: ApiErrorType[] = ['ClientError', 'CancelledError'];

describe('Feature: mobile-api-client, Property 9: Error type categorization', () => {
  it('categorizes by precedence: cancelled > timeout > auth > server > client > network', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 599 }),
        fc.boolean(), // isTimeout
        fc.boolean(), // isCancelled
        fc.boolean(), // networkError
        (status, isTimeout, isCancelled, networkError) => {
          const type = resolveApiErrorType({ status, isTimeout, isCancelled, networkError });

          if (isCancelled) {
            expect(type).toBe('CancelledError');
            return;
          }

          if (isTimeout) {
            expect(type).toBe('TimeoutError');
            return;
          }

          if (status === 401) {
            expect(type).toBe('AuthenticationError');
            return;
          }

          if (status >= 500) {
            expect(type).toBe('ServerError');
            return;
          }

          if (status >= 400) {
            expect(type).toBe('ClientError');
            return;
          }

          if (networkError) {
            expect(type).toBe('NetworkError');
            return;
          }

          expect(type).toBe('NetworkError');
        }
      ),
      { numRuns: 150 }
    );
  });

  it('marks retryable types as retryable by default', () => {
    fc.assert(
      fc.property(fc.constantFrom<ApiErrorType>(...retryableTypes), (type) => {
        const error = new ApiError(type, 'message');
        expect(error.isRetryable).toBe(true);
      }),
      { numRuns: retryableTypes.length }
    );
  });

  it('marks non-retryable types as not retryable by default', () => {
    fc.assert(
      fc.property(fc.constantFrom<ApiErrorType>(...nonRetryableTypes), (type) => {
        const error = new ApiError(type, 'message');
        expect(error.isRetryable).toBe(false);
      }),
      { numRuns: nonRetryableTypes.length }
    );
  });

  it('respects explicit isRetryable override', () => {
    fc.assert(
      fc.property(fc.boolean(), (flag) => {
        const error = new ApiError('ClientError', 'message', { isRetryable: flag });
        expect(error.isRetryable).toBe(flag);
      }),
      { numRuns: 20 }
    );
  });

  it('type guard identifies ApiError instances', () => {
    const apiError = new ApiError('NetworkError', 'network down');
    const regularError = new Error('nope');

    expect(ApiError.isApiError(apiError)).toBe(true);
    expect(ApiError.isApiError(regularError)).toBe(false);
    expect(ApiError.isApiError({})).toBe(false);
  });
});
