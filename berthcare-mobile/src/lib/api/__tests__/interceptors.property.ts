import fc from 'fast-check';
import { applyAuthHeader } from '../interceptors';
import type { TokenProvider } from '../types';

describe('Feature: mobile-api-client, Property 2: Authorization header injection', () => {
  const tokenArb = fc.hexaString({ minLength: 16, maxLength: 64 });
  const headerKeyArb = fc
    .stringOf(fc.hexa(), { minLength: 3, maxLength: 12 })
    .map((value) => `x-${value.toLowerCase()}`);
  const headersArb = fc.dictionary(headerKeyArb, fc.string({ maxLength: 24 }), { maxKeys: 5 });

  it('adds Authorization bearer token when token exists and no header is present', async () => {
    await fc.assert(
      fc.asyncProperty(tokenArb, async (token) => {
        const provider: TokenProvider = {
          getAccessToken: async () => token,
          refreshToken: async () => token,
          clearTokens: async () => undefined,
        };

        const result = await applyAuthHeader({}, provider, {
          url: 'https://api.example.com/foo',
          method: 'GET',
          headers: {},
        });

        expect(result.Authorization).toBe(`Bearer ${token}`);
      }),
      { numRuns: 30 }
    );
  });

  it('does not add Authorization when token is missing', async () => {
    await fc.assert(
      fc.asyncProperty(headersArb, async (callerHeaders) => {
        const provider: TokenProvider = {
          getAccessToken: async () => null,
          refreshToken: async () => null,
          clearTokens: async () => undefined,
        };

        const result = await applyAuthHeader({ ...callerHeaders }, provider, {
          url: 'https://api.example.com/foo',
          method: 'GET',
          headers: { ...callerHeaders },
        });

        expect(result.Authorization).toBeUndefined();
      }),
      { numRuns: 20 }
    );
  });

  it('preserves existing Authorization header from caller', async () => {
    await fc.assert(
      fc.asyncProperty(tokenArb, async (token) => {
        const provider: TokenProvider = {
          getAccessToken: async () => token,
          refreshToken: async () => token,
          clearTokens: async () => undefined,
        };

        const callerAuth = 'Bearer from-caller';
        const result = await applyAuthHeader({ Authorization: callerAuth }, provider, {
          url: 'https://api.example.com/foo',
          method: 'GET',
          headers: { Authorization: callerAuth },
        });

        expect(result.Authorization).toBe(callerAuth);
      }),
      { numRuns: 30 }
    );
  });

  it('preserves all caller headers when injecting Authorization', async () => {
    await fc.assert(
      fc.asyncProperty(tokenArb, headersArb, async (token, callerHeaders) => {
        const provider: TokenProvider = {
          getAccessToken: async () => token,
          refreshToken: async () => token,
          clearTokens: async () => undefined,
        };

        const result = await applyAuthHeader({ ...callerHeaders }, provider, {
          url: 'https://api.example.com/foo',
          method: 'GET',
          headers: { ...callerHeaders },
        });

        // Caller headers are unchanged
        for (const [key, value] of Object.entries(callerHeaders)) {
          expect(result[key]).toBe(value);
        }

        expect(result.Authorization).toBe(`Bearer ${token}`);
      }),
      { numRuns: 30 }
    );
  });
});
