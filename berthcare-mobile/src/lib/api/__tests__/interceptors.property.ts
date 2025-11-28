import fc from 'fast-check';
import { applyAuthHeader } from '../interceptors';
import type { TokenProvider } from '../types';

describe('Feature: mobile-api-client, Property 2: Authorization header injection', () => {
  const tokenArb = fc.hexaString({ minLength: 16, maxLength: 64 });

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
      { numRuns: 30 },
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
      { numRuns: 30 },
    );
  });
});
