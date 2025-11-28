import { QuickSQLite } from 'react-native-quick-sqlite';
import { getOrCreateEncryptionKey } from './encryption';
import { runMigrations } from './migrations';
import { CREATE_INDEX_STATEMENTS, CREATE_TABLE_STATEMENTS } from './schema';

const DB_NAME = 'berthcare.db';

type TransactionFn = Parameters<typeof QuickSQLite.transaction>[1];
type Execute = (query: string, params?: any[]) => ReturnType<typeof QuickSQLite.execute>;
type ExecuteAsync = (query: string, params?: any[]) => ReturnType<typeof QuickSQLite.executeAsync>;
type TransactionExecutor = (fn: TransactionFn) => Promise<void>;

export type DatabaseHandle = {
  name: string;
  execute: Execute;
  executeAsync: ExecuteAsync;
  transaction: TransactionExecutor;
};

let initialized = false;
let initializationPromise: Promise<void> | null = null;

const applyEncryptionKey = async (key: string): Promise<void> => {
  await QuickSQLite.executeAsync(DB_NAME, 'PRAGMA key = ?;', [key]);
};

const runStatements = async (statements: string[]): Promise<void> => {
  for (const statement of statements) {
    await QuickSQLite.executeAsync(DB_NAME, statement);
  }
};

export const initializeSchema = async (): Promise<void> => {
  await runStatements(CREATE_TABLE_STATEMENTS);
  await runStatements(CREATE_INDEX_STATEMENTS);
};

export const initialize = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    QuickSQLite.open(DB_NAME);
    const encryptionKey = await getOrCreateEncryptionKey();
    await applyEncryptionKey(encryptionKey);
    await initializeSchema();
    await runMigrations(DB_NAME);
    initialized = true;
  })();

  try {
    await initializationPromise;
  } catch (error) {
    try {
      QuickSQLite.close(DB_NAME);
    } catch {
      // ignore close errors if open failed midway
    }
    throw error;
  } finally {
    initializationPromise = null;
  }
};

export const close = (): void => {
  if (!initialized) {
    return;
  }

  QuickSQLite.close(DB_NAME);
  initialized = false;
};

export const getDatabase = (): DatabaseHandle => {
  if (!initialized) {
    throw new Error('Database is not initialized. Call initialize() first.');
  }

  return {
    name: DB_NAME,
    execute: (query: string, params?: any[]) => QuickSQLite.execute(DB_NAME, query, params),
    executeAsync: (query: string, params?: any[]) =>
      QuickSQLite.executeAsync(DB_NAME, query, params),
    transaction: (fn: TransactionFn) => QuickSQLite.transaction(DB_NAME, fn),
  };
};

export const isInitialized = (): boolean => initialized;
