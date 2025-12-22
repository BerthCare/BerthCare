// **Feature: mobile-secure-token-storage, Property 1: Token storage round-trip**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

import fc from 'fast-check';
import { STORAGE_KEYS } from '../secure-storage';
import { InMemorySecureStorage } from './helpers/in-memory-storage';

describe('Feature: mobile-secure-token-storage, Property 1: Token storage round-trip', () => {
  let storage: InMemorySecureStorage;

  beforeEach(() => {
    storage = new InMemorySecureStorage();
  });

  it('all STORAGE_KEYS are unique and non-empty', () => {
    const values = Object.values(STORAGE_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
    values.forEach((value) => {
      expect(value).toEqual(expect.any(String));
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });

  it('for any valid token string, storing and retrieving returns the exact same value', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary non-empty strings representing tokens
        fc.string({ minLength: 1, maxLength: 1000 }),
        // Use one of the defined storage keys
        fc.constantFrom(...Object.values(STORAGE_KEYS)),
        async (tokenValue, storageKey) => {
          const freshStorage = new InMemorySecureStorage();
          // Store the token
          await freshStorage.setItem(storageKey, tokenValue);

          // Retrieve the token
          const retrievedValue = await freshStorage.getItem(storageKey);

          // The retrieved value must exactly match the stored value
          expect(retrievedValue).toBe(tokenValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any JWT-like token, storing and retrieving preserves the exact format', async () => {
    // JWT tokens have a specific format: header.payload.signature (base64url encoded)
    // Note: fast-check base64String uses standard base64 (not base64url). This is fine for
    // storage round-trip validation but not for strict JWT format validation.
    const jwtArbitrary = fc
      .tuple(
        fc.base64String({ minLength: 10, maxLength: 100 }), // header
        fc.base64String({ minLength: 20, maxLength: 500 }), // payload
        fc.base64String({ minLength: 20, maxLength: 100 }) // signature
      )
      .map(([header, payload, signature]) => `${header}.${payload}.${signature}`);

    await fc.assert(
      fc.asyncProperty(jwtArbitrary, async (jwtToken) => {
        const freshStorage = new InMemorySecureStorage();
        // Store as access token
        await freshStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, jwtToken);

        // Retrieve
        const retrieved = await freshStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        // Must be exactly the same
        expect(retrieved).toBe(jwtToken);
      }),
      { numRuns: 100 }
    );
  });

  it('for any numeric timestamp string, storing and retrieving preserves the value', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate timestamps (Unix milliseconds)
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }).map(String),
        fc.constantFrom(
          STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
          STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
          STORAGE_KEYS.LAST_ONLINE_TIMESTAMP
        ),
        async (timestamp, storageKey) => {
          await storage.setItem(storageKey, timestamp);
          const retrieved = await storage.getItem(storageKey);
          expect(retrieved).toBe(timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('retrieving a non-existent key returns null', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...Object.values(STORAGE_KEYS)), async (storageKey) => {
        // Fresh storage, nothing stored yet
        const freshStorage = new InMemorySecureStorage();
        const retrieved = await freshStorage.getItem(storageKey);
        expect(retrieved).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('removeItem clears the specific key while preserving others', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (value1, value2) => {
          const freshStorage = new InMemorySecureStorage();
          // Store two different values
          await freshStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, value1);
          await freshStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, value2);

          // Remove only access token
          await freshStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

          // Access token should be null
          expect(await freshStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();

          // Refresh token should still exist
          expect(await freshStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe(value2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('clear removes all authentication-related keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessToken: fc.string({ minLength: 1, maxLength: 100 }),
          refreshToken: fc.string({ minLength: 1, maxLength: 100 }),
          accessExpiry: fc.integer({ min: 0 }).map(String),
          refreshExpiry: fc.integer({ min: 0 }).map(String),
          lastOnline: fc.integer({ min: 0 }).map(String),
        }),
        async (tokens) => {
          // Store all tokens
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, tokens.accessExpiry);
          await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, tokens.refreshExpiry);
          await storage.setItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP, tokens.lastOnline);

          // Clear all
          await storage.clear();

          // All keys should return null
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY)).toBeNull();
          expect(await storage.getItem(STORAGE_KEYS.LAST_ONLINE_TIMESTAMP)).toBeNull();

          // Storage should be empty
          expect(storage.getStorageSize()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('overwriting a key replaces the previous value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(...Object.values(STORAGE_KEYS)),
        async (value1, value2, storageKey) => {
          // Store first value
          await storage.setItem(storageKey, value1);
          expect(await storage.getItem(storageKey)).toBe(value1);

          // Overwrite with second value
          await storage.setItem(storageKey, value2);
          expect(await storage.getItem(storageKey)).toBe(value2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
