// **Feature: sqlite-encryption-setup, Property 4: Query filters return correct subset**
// **Validates: Requirements 5.5**

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
  group: number;
  active: boolean;
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
      table.set(row.id as string, row);
      return { rowsAffected: 1 };
    }

    if (query.startsWith('SELECT * FROM') && query.includes('WHERE')) {
      const whereClause = query.split('WHERE')[1];
      const columns = whereClause
        .split('AND')
        .map((part) => part.trim().split('=')[0].trim())
        .filter(Boolean);

      const matches = Array.from(table.values()).filter((row) =>
        columns.every((col, idx) => row[col] === params[idx])
      );

      return { rows: { _array: matches } };
    }

    if (query.startsWith('SELECT * FROM')) {
      return { rows: { _array: Array.from(table.values()) } };
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

describe('Feature: sqlite-encryption-setup, Property 4: Query filters return correct subset', () => {
  it('returns only rows matching the filter conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            group: fc.integer({ min: 0, max: 3 }),
            active: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20, selector: (r) => r.id }
        ),
        fc.integer({ min: 0, max: 3 }),
        fc.boolean(),
        async (entities, targetGroup, targetActive) => {
          const db = createInMemoryDb();
          const repo = new BaseRepository<TestEntity, TestCreateInput, TestUpdateInput>('entities', {}, () => db);

          for (const entity of entities) {
            await repo.create(entity);
          }

          const filtered = await repo.findAll({ group: targetGroup, active: targetActive });
          const expected = entities.filter(
            (entity) => entity.group === targetGroup && entity.active === targetActive
          );

          expect(filtered).toEqual(expected);
        }
      ),
      { numRuns: 75 }
    );
  });
});
