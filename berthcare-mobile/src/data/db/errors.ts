export type DatabaseErrorCode =
  | 'CONSTRAINT_VIOLATION'
  | 'NOT_FOUND'
  | 'ENCRYPTION_ERROR'
  | 'MIGRATION_FAILED'
  | 'STORAGE_FULL'
  | 'UNKNOWN';

export interface DatabaseError {
  code: DatabaseErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type DatabaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: DatabaseError };
