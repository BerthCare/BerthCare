/* eslint-disable @typescript-eslint/no-require-imports */

// **Feature: sqlite-encryption-setup, Property 2: Update preserves unmodified fields**
// **Validates: Requirements 5.3**

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
  payload: unknown;
  count: number;
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

    if (query.startsWith('UPDATE')) {
      const id = String(params[params.length - 1] ?? '');
      const row = table.get(id);
      if (row) {
        const setSection = query.split('SET')[1] ?? '';
        const assignments = (setSection.split('WHERE')[0] ?? '')
          .split(',')
          .map((part) => (part.split(' = ')[0] ?? '').trim());
        assignments.forEach((col, idx) => {
          row[col] = params[idx] as unknown;
        });
        table.set(id, row);
      }
      return { rowsAffected: 1, rows: { _array: [] as Row[] } };
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

describe('Feature: sqlite-encryption-setup, Property 2: Update preserves unmodified fields', () => {
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

  it('keeps untouched fields unchanged when updating a subset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        jsonValue,
        jsonValue,
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        async (
          id,
          nameInitial,
          nameUpdated,
          payloadInitial,
          payloadUpdated,
          countInitial,
          countUpdated,
          changeName,
          changePayload,
          changeCount
        ) => {
          const db = createInMemoryDb();
          const repo = new BaseRepository<TestEntity, TestCreateInput, TestUpdateInput>(
            'entities',
            { jsonFields: ['payload'] },
            () => db as unknown as DatabaseHandle
          );

          const initial: TestCreateInput = {
            id,
            name: nameInitial,
            payload: payloadInitial,
            count: countInitial,
          };

          const updateInput: TestUpdateInput = {};
          if (changeName) updateInput.name = nameUpdated;
          if (changePayload) updateInput.payload = payloadUpdated;
          if (changeCount) updateInput.count = countUpdated;

          await repo.create(initial);
          const updated = await repo.update(id, updateInput);
          const fetched = await repo.findById(id);

          const expectedName = updateInput.name !== undefined ? updateInput.name : initial.name;
          const expectedPayload =
            updateInput.payload !== undefined ? updateInput.payload : initial.payload;
          const expectedCount = updateInput.count !== undefined ? updateInput.count : initial.count;

          expect(updated).toEqual({
            id,
            name: expectedName,
            payload: expectedPayload,
            count: expectedCount,
          });
          expect(fetched).toEqual(updated);
        }
      ),
      { numRuns: 75 }
    );
  });
});
import type { DatabaseHandle } from '../manager';
