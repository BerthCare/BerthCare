import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type {
  CreateSyncQueueInput,
  SyncQueueItem,
  SyncQueueStatus,
  UpdateSyncQueueInput,
} from '../types';

type Row = Record<string, unknown>;
type QueryResultRows = { rows?: { _array?: Row[] } | Row[] };

const rowsFromResult = (result: QueryResultRows): Row[] => {
  const rows = result?.rows;
  if (Array.isArray(rows)) {
    return rows as Row[];
  }
  if (rows && '_array' in rows && Array.isArray(rows._array)) {
    return rows._array as Row[];
  }
  return [];
};

const nowIso = (): string => new Date().toISOString();

export class SyncQueueRepository extends BaseRepository<
  SyncQueueItem,
  CreateSyncQueueInput,
  UpdateSyncQueueInput
> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super('sync_queue', {}, dbProvider);
  }

  async findPending(): Promise<SyncQueueItem[]> {
    return this.findAll({ status: 'pending' as SyncQueueStatus });
  }

  async findByPriority(priority: number): Promise<SyncQueueItem[]> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName} WHERE priority = ? ORDER BY createdAt ASC;`,
      [priority]
    );
    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }

  async markAsProcessed(id: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      lastAttemptAt: nowIso(),
      errorMessage: null,
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const db = this.getDb();
    await db.executeAsync(
      `UPDATE ${this.tableName}
       SET attempts = attempts + 1,
           status = ?,
           errorMessage = ?,
           lastAttemptAt = ?
       WHERE ${this.primaryKey} = ?;`,
      ['failed', error, nowIso(), id]
    );
  }
}
