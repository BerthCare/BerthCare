import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type { CreateScheduleInput, Schedule, UpdateScheduleInput } from '../types';

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

export class ScheduleRepository extends BaseRepository<
  Schedule,
  CreateScheduleInput,
  UpdateScheduleInput
> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super('schedules', {}, dbProvider);
  }

  async create(data: CreateScheduleInput): Promise<Schedule> {
    const now = new Date().toISOString();
    const record: CreateScheduleInput = {
      status: 'scheduled',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    return super.create(record);
  }

  async findByDateAndCaregiver(date: string, caregiverId: string): Promise<Schedule[]> {
    return this.findAll({ scheduledDate: date, caregiverId });
  }

  async findPendingSync(): Promise<Schedule[]> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT s.* FROM schedules s
       INNER JOIN sync_queue q ON q.entityId = s.id
       WHERE q.entityType = ? AND q.status = ?;`,
      ['schedule', 'pending']
    );

    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
