import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type { CreateScheduleInput, Schedule, UpdateScheduleInput } from '../types';
import { rowsFromResult } from './utils';

export class ScheduleRepository extends BaseRepository<
  Schedule,
  CreateScheduleInput,
  UpdateScheduleInput
> {
  private static readonly ENTITY_TYPE = 'schedule';

  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super('schedules', {}, dbProvider);
  }

  async create(data: CreateScheduleInput): Promise<Schedule> {
    const now = new Date().toISOString();
    // Defaults can be overridden by provided data (useful for imports/migrations/tests).
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
      [ScheduleRepository.ENTITY_TYPE, 'pending']
    );

    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
