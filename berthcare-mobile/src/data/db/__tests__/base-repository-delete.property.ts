/* eslint-disable @typescript-eslint/no-require-imports */

// **Feature: sqlite-encryption-setup, Property 3: Delete removes entity**
// **Validates: Requirements 5.4**

import type { BaseRepository as BaseRepositoryClass } from '../repositories';
import fc from 'fast-check';

jest.mock('react-native-quick-sqlite', () => ({
  QuickSQLite: {
    open: jest.fn(),
    close: jest.fn(),
    execute: jest.fn(),
    executeAsync: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('../manager', () => ({
  getDatabase: jest.fn(() => {
    throw new Error('getDatabase should be mocked in tests');
  }),
}));

const {
  BaseRepository,
}: { BaseRepository: typeof BaseRepositoryClass } = require('../repositories');

type TestEntity = {
  id: string;
  name: string;
};

type TestCreateInput = TestEntity;
type TestUpdateInput = Partial<TestEntity>;

type Row = Record<string, unknown>;

const createInMemoryDb = () => {
  const table = new Map<string, Row>();

  const executeAsync = async (query: string, params: unknown[] = []) => {
    if (query.startsWith('INSERT INTO')) {
      const columnMatch = query.match(/\(([^)]+)\)/);
      const columns = columnMatch?.[1]?.split(',').map((c) => c.trim()) ?? [];
      const row: Row = {};
      columns.forEach((col, idx) => {
        row[col] = params[idx];
      });
      table.set(String(row.id ?? ''), row);
      return { rowsAffected: 1, rows: { _array: [] as Row[] } };
    }

    if (query.startsWith('SELECT * FROM') && query.includes('WHERE')) {
      const id = String(params[0] ?? '');
      const row = table.get(id);
      return { rows: { _array: row ? [row] : [] }, rowsAffected: row ? 1 : 0 };
    }

    if (query.startsWith('SELECT * FROM')) {
      return { rows: { _array: Array.from(table.values()) }, rowsAffected: table.size };
    }

    if (query.startsWith('DELETE')) {
      const id = String(params[0] ?? '');
      table.delete(id);
      return { rowsAffected: 1, rows: { _array: [] as Row[] } };
    }

    return { rowsAffected: 0, rows: { _array: [] as Row[] } };
  };

  return {
    name: 'test',
    execute: jest.fn(),
    executeAsync,
    transaction: jest.fn(),
  };
};

describe('Feature: sqlite-encryption-setup, Property 3: Delete removes entity', () => {
  it('removes the record so it cannot be fetched afterwards', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.string({ minLength: 1, maxLength: 50 }), async (id, name) => {
        const db = createInMemoryDb();
        const repo = new BaseRepository<TestEntity, TestCreateInput, TestUpdateInput>(
          'entities',
          {},
          () => db as unknown as DatabaseHandle
        );

        await repo.create({ id, name });
        const existing = await repo.findById(id);
        expect(existing).not.toBeNull();

        await repo.delete(id);
        const afterDelete = await repo.findById(id);
        const all = await repo.findAll();

        expect(afterDelete).toBeNull();
        expect(all).not.toContainEqual({ id, name });
      }),
      { numRuns: 75 }
    );
  });
});
import type { DatabaseHandle } from '../manager';
