import { DatabaseService } from './service';

export { getOrCreateEncryptionKey } from './encryption';
export {
  close,
  getDatabase,
  initialize,
  initializeSchema,
  isInitialized,
  type DatabaseHandle,
} from './manager';
export {
  schema,
  CREATE_TABLE_STATEMENTS,
  CREATE_INDEX_STATEMENTS,
  type SchemaDefinition,
} from './schema';
export { getCurrentSchemaVersion, runMigrations, type Migration } from './migrations';
export * from './errors';
export * from './types';
export * from './repositories';
export { DatabaseService } from './service';

export const databaseService = new DatabaseService();
