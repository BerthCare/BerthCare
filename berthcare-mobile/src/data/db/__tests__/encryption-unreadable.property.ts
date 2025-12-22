/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
// **Feature: sqlite-encryption-setup, Property 5: Encrypted database is unreadable without key**
// **Validates: Requirements 4.1, 4.2, 4.3**

import fc from 'fast-check';

let storedKey: string | null = null;

const mockOpen = jest.fn();
const mockClose = jest.fn();
const mockExecute = jest.fn();
const mockExecuteAsync = jest.fn(async (_dbName: string, statement: string, params: any[] = []) => {
  if (statement.startsWith('PRAGMA key')) {
    const providedKey = params[0];
    if (storedKey && storedKey !== providedKey) {
      throw new Error('invalid key');
    }
    storedKey = providedKey;
    return {};
  }
  return {};
});

jest.mock('react-native-quick-sqlite', () => ({
  QuickSQLite: {
    open: mockOpen,
    close: mockClose,
    execute: mockExecute,
    executeAsync: mockExecuteAsync,
    transaction: jest.fn(),
  },
}));

const mockGetOrCreateEncryptionKey = jest.fn();

jest.mock('../encryption', () => ({
  getOrCreateEncryptionKey: mockGetOrCreateEncryptionKey,
}));

describe('Feature: sqlite-encryption-setup, Property 5: Encrypted database is unreadable without key', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const resetState = () => {
    storedKey = null;
    jest.resetModules();
    jest.clearAllMocks();
  };

  const loadManager = () => {
    const { initialize, close } = require('../manager');
    const { getOrCreateEncryptionKey } = require('../encryption');
    return { initialize, close, getOrCreateEncryptionKey };
  };

  it('fails to initialize when provided key does not match existing database key', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (key) => {
        resetState();
        const wrongKey = `${key}-wrong`;

        const { initialize, close, getOrCreateEncryptionKey } = loadManager();
        getOrCreateEncryptionKey.mockResolvedValueOnce(key);
        getOrCreateEncryptionKey.mockResolvedValueOnce(wrongKey);

        await initialize();
        close();

        await expect(initialize()).rejects.toThrow(/invalid key/i);

        expect(mockExecuteAsync).toHaveBeenCalledWith(expect.any(String), 'PRAGMA key = ?;', [key]);
        expect(mockExecuteAsync).toHaveBeenCalledWith(expect.any(String), 'PRAGMA key = ?;', [
          wrongKey,
        ]);
      }),
      { numRuns: 25 }
    );
  });

  it('initializes successfully when using the correct key', async () => {
    resetState();
    const expectedKey = 'correct-key';

    const { initialize, getOrCreateEncryptionKey } = loadManager();
    getOrCreateEncryptionKey.mockResolvedValue(expectedKey);

    await expect(initialize()).resolves.not.toThrow();
    expect(mockExecuteAsync).toHaveBeenCalledWith(expect.any(String), 'PRAGMA key = ?;', [
      expectedKey,
    ]);
  });
});
