import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type { CreateVisitInput, UpdateVisitInput, Visit } from '../types';

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

export class VisitRepository extends BaseRepository<Visit, CreateVisitInput, UpdateVisitInput> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super(
      'visits',
      { jsonFields: ['documentation', 'photoIds', 'location', 'changedFields'] },
      dbProvider
    );
  }

  async findBySchedule(scheduleId: string): Promise<Visit | null> {
    const results = await this.findAll({ scheduleId });
    return results[0] ?? null;
  }

  async findLastVisitForClient(clientId: string): Promise<Visit | null> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName}
       WHERE clientId = ?
       ORDER BY visitDate DESC, updatedAt DESC
       LIMIT 1;`,
      [clientId]
    );

    const rows = rowsFromResult(result);
    return rows.length > 0 ? this.deserializeRecord(rows[0]!) : null;
  }

  async findPendingSync(): Promise<Visit[]> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT v.* FROM visits v
       INNER JOIN sync_queue q ON q.entityId = v.id
       WHERE q.entityType = ? AND q.status = ?;`,
      ['visit', 'pending']
    );

    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
