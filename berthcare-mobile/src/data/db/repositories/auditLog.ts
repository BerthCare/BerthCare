import { getDatabase, type DatabaseHandle } from '../manager';
import type { AuditLog, CreateAuditLogInput } from '../types';
import type { JsonField } from './base';
import { BaseRepository } from './base';

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

export class AuditLogRepository extends BaseRepository<AuditLog, CreateAuditLogInput, never> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    const jsonFields: JsonField[] = ['before', 'after'];
    super('audit_logs', { jsonFields }, dbProvider);
  }

  async create(data: CreateAuditLogInput): Promise<AuditLog> {
    return super.create(data);
  }

  // Audit logs are append-only; no update or delete methods are exposed.

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.findAll({ entityType, entityId });
  }

  async findByDateRange(startDateInclusive: string, endDateInclusive: string): Promise<AuditLog[]> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName}
       WHERE createdAt >= ? AND createdAt <= ?
       ORDER BY createdAt ASC;`,
      [startDateInclusive, endDateInclusive]
    );

    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
