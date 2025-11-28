/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
// **Feature: sqlite-encryption-setup, Error handling scenarios**
// **Validates: Requirements 3.3, 6.3**

jest.mock('react-native-quick-sqlite', () => {
  const executeAsync = jest.fn();
  return {
    QuickSQLite: {
      open: jest.fn(),
      close: jest.fn(),
      execute: jest.fn(),
      executeAsync,
      transaction: jest.fn(),
    },
  };
});

jest.mock('../encryption', () => ({
  getOrCreateEncryptionKey: jest.fn().mockResolvedValue('test-key'),
}));

describe('Error handling', () => {
  const resetMocks = () => {
    jest.resetModules();
    jest.clearAllMocks();
  };

  it('propagates constraint violations from repository operations', async () => {
    resetMocks();
    const { QuickSQLite } = require('react-native-quick-sqlite');
    const {
      BaseRepository,
    }: {
      BaseRepository: typeof import('../repositories').BaseRepository;
    } = require('../repositories');
    const constraintError = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: schedules.id');
    QuickSQLite.executeAsync.mockImplementationOnce(async () => {
      throw constraintError;
    });

    const repo = new BaseRepository<any, any, any>('schedules', {}, () => ({
      name: 'test',
      execute: QuickSQLite.execute,
      executeAsync: QuickSQLite.executeAsync,
      transaction: QuickSQLite.transaction,
    }));

    await expect(repo.create({ id: 'duplicate', name: 'Schedule' })).rejects.toThrow(
      constraintError
    );
  });

  it('blocks data access after initialization failure', async () => {
    resetMocks();
    const { QuickSQLite } = require('react-native-quick-sqlite');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    QuickSQLite.executeAsync.mockRejectedValueOnce(new Error('invalid key'));

    const { initialize, getDatabase } = require('../manager');

    await expect(initialize()).rejects.toThrow('invalid key');
    expect(consoleSpy).toHaveBeenCalled();
    expect(() => getDatabase()).toThrow(/initialization failed/i);

    consoleSpy.mockRestore();
  });
});
