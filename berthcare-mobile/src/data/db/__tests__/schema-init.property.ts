/* eslint-disable @typescript-eslint/no-require-imports */
// **Feature: sqlite-encryption-setup, Property 6: Schema initialization is idempotent**
// **Validates: Requirements 3.1, 3.2**

import fc from 'fast-check';

const mockOpen = jest.fn();
const mockClose = jest.fn();
const mockExecute = jest.fn();
const mockExecuteAsync = jest.fn(async (_dbName: string, statement: string) => {
  if (statement.startsWith('SELECT version FROM schema_version')) {
    return { rows: { _array: [] } };
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

jest.mock('../encryption', () => ({
  getOrCreateEncryptionKey: jest.fn().mockResolvedValue('test-key'),
}));

describe('Feature: sqlite-encryption-setup, Property 6: Schema initialization is idempotent', () => {
  const setup = () => {
    jest.resetModules();
    jest.clearAllMocks();

    mockExecuteAsync.mockImplementation(async (_dbName: string, statement: string) => {
      if (statement.startsWith('SELECT version FROM schema_version')) {
        return { rows: { _array: [] } };
      }
      return {};
    });

    const { getOrCreateEncryptionKey } = require('../encryption');
    const { initialize } = require('../manager');
    const { CREATE_INDEX_STATEMENTS, CREATE_TABLE_STATEMENTS } = require('../schema');

    return {
      getOrCreateEncryptionKey,
      initialize,
      CREATE_INDEX_STATEMENTS,
      CREATE_TABLE_STATEMENTS,
    };
  };

  it('runs initialization only once regardless of repeated calls', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (runs) => {
        const {
          getOrCreateEncryptionKey,
          initialize,
          CREATE_INDEX_STATEMENTS,
          CREATE_TABLE_STATEMENTS,
        } = setup();

        await initialize();
        const initialCallCount = mockExecuteAsync.mock.calls.length;

        for (let i = 1; i < runs; i += 1) {
          await initialize();
        }

        expect(mockExecuteAsync.mock.calls.length).toBe(initialCallCount);
        expect(mockOpen).toHaveBeenCalledTimes(1);
        expect(getOrCreateEncryptionKey).toHaveBeenCalledTimes(1);

        const executedStatements = mockExecuteAsync.mock.calls.map(
          ([, statement]: [unknown, string]) => statement
        );

        expect(executedStatements[0]).toBe('PRAGMA key = ?;');
        CREATE_TABLE_STATEMENTS.forEach((statement: string) => {
          expect(executedStatements.filter((s) => s === statement)).toHaveLength(1);
        });
        CREATE_INDEX_STATEMENTS.forEach((statement: string) => {
          expect(executedStatements.filter((s) => s === statement)).toHaveLength(1);
        });
        expect(
          executedStatements.filter((s) => s.includes('schema_version')).length
        ).toBeGreaterThan(0);
        expect(
          executedStatements.filter((s) => s.startsWith('INSERT INTO schema_version')).length
        ).toBe(1);
      }),
      { numRuns: 50 }
    );
  });
});
