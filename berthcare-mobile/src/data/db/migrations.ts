import { QuickSQLite } from 'react-native-quick-sqlite';

export type Migration = {
  version: number;
  name: string;
  up: (execute: (query: string, params?: any[]) => Promise<unknown>) => Promise<void>;
};

const SCHEMA_VERSION_TABLE = `CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  appliedAt TEXT NOT NULL
);`;

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'baseline schema',
    up: async () => {
      // Baseline schema is created during initializeSchema; this migration simply records the version.
    },
  },
];

const ensureSchemaVersionTable = async (dbName: string): Promise<void> => {
  await QuickSQLite.executeAsync(dbName, SCHEMA_VERSION_TABLE);
};

const getAppliedVersions = async (dbName: string): Promise<Set<number>> => {
  const result = await QuickSQLite.executeAsync(dbName, 'SELECT version FROM schema_version ORDER BY version;');
  const rows = (result as any)?.rows?._array ?? [];
  return new Set(rows.map((row: { version: number }) => Number(row.version)));
};

const runInTransaction = async (
  dbName: string,
  fn: (execute: (query: string, params?: any[]) => Promise<unknown>) => Promise<void>
): Promise<void> => {
  await QuickSQLite.executeAsync(dbName, 'BEGIN TRANSACTION');
  try {
    const exec = (query: string, params?: any[]) => QuickSQLite.executeAsync(dbName, query, params);
    await fn(exec);
    await QuickSQLite.executeAsync(dbName, 'COMMIT');
  } catch (error) {
    await QuickSQLite.executeAsync(dbName, 'ROLLBACK');
    throw error;
  }
};

const applyMigration = async (dbName: string, migration: Migration): Promise<void> => {
  await runInTransaction(dbName, async (execute) => {
    await migration.up(execute);
    await execute('INSERT INTO schema_version (version, name, appliedAt) VALUES (?, ?, ?);', [
      migration.version,
      migration.name,
      new Date().toISOString(),
    ]);
  });
};

export const runMigrations = async (dbName: string): Promise<void> => {
  await ensureSchemaVersionTable(dbName);

  const appliedVersions = await getAppliedVersions(dbName);
  const pendingMigrations = [...MIGRATIONS].sort((a, b) => a.version - b.version).filter((m) => !appliedVersions.has(m.version));

  for (const migration of pendingMigrations) {
    await applyMigration(dbName, migration);
  }
};

export const getCurrentSchemaVersion = (): number =>
  MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length - 1].version : 0;
