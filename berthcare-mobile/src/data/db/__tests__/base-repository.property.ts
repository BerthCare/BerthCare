// **Feature: sqlite-encryption-setup, Property 1: Insert-then-query round trip**
// **Validates: Requirements 5.1, 5.2**

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

const { BaseRepository }: { BaseRepository: typeof BaseRepositoryClass } = require('../repositories');

type TestEntity = {
  id: string;
  name: string;
  payload: unknown;
  count: number;
};

type TestCreateInput = TestEntity;
type TestUpdateInput = Partial<TestEntity>;

type Row = Record<string, unknown>;

const createInMemoryDb = () => {
  const table = new Map<string, Row>();

  const executeAsync = async (query: string, params: any[] = []) => {
    if (query.startsWith('INSERT INTO')) {
      const columnMatch = query.match(/\(([^)]+)\)/);
      const columns = columnMatch ? columnMatch[1].split(',').map((c) => c.trim()) : [];
      const row: Row = {};
      columns.forEach((col, idx) => {
        row[col] = params[idx];
      });
      const id = row.id as string;
      table.set(id, row);
      return { rowsAffected: 1 };
    }

    if (query.startsWith('SELECT * FROM') && query.includes('WHERE')) {
      const id = params[0];
      const row = table.get(id);
      return { rows: { _array: row ? [row] : [] } };
    }

    if (query.startsWith('SELECT * FROM')) {
      return { rows: { _array: Array.from(table.values()) } };
    }

    if (query.startsWith('UPDATE')) {
      const id = params[params.length - 1] as string;
      const row = table.get(id);
      if (row) {
        const assignments = query
          .split('SET')[1]
          .split('WHERE')[0]
          .split(',')
          .map((part) => part.trim().split(' = ')[0]);
        assignments.forEach((col, idx) => {
          row[col] = params[idx];
        });
        table.set(id, row);
      }
      return { rowsAffected: 1 };
    }

    if (query.startsWith('DELETE')) {
      const id = params[0] as string;
      table.delete(id);
      return { rowsAffected: 1 };
    }

    return {};
  };

  return {
    name: 'test',
    execute: jest.fn(),
    executeAsync,
    transaction: jest.fn(),
  };
};

describe('Feature: sqlite-encryption-setup, Property 1: Insert-then-query round trip', () => {
  const jsonValue = fc.letrec((tie) => ({
    value: fc.oneof(
      fc.string(),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.array(tie('value'), { maxLength: 4 }),
      fc.dictionary(fc.string({ minLength: 0, maxLength: 10 }), tie('value'), { maxKeys: 4 })
    ),
  })).value;

  it('returns the same entity after insert and query', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        jsonValue,
        fc.integer({ min: 0, max: 1_000_000 }),
        async (id, name, payload, count) => {
          const db = createInMemoryDb();
          const repo = new BaseRepository<TestEntity, TestCreateInput, TestUpdateInput>(
            'entities',
            { jsonFields: ['payload'] },
            () => db
          );

          const input: TestCreateInput = { id, name, payload, count };

          const created = await repo.create(input);
          const fetched = await repo.findById(id);
          const all = await repo.findAll();

          expect(created).toEqual(input);
          expect(fetched).toEqual(input);
          expect(all).toContainEqual(input);
        }
      ),
      { numRuns: 75 }
    );
  });
});
