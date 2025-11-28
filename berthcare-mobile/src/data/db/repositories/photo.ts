import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type { CreatePhotoInput, Photo, UpdatePhotoInput } from '../types';

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

export class PhotoRepository extends BaseRepository<Photo, CreatePhotoInput, UpdatePhotoInput> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super('photos', {}, dbProvider);
  }

  async findByVisit(visitId: string): Promise<Photo[]> {
    return this.findAll({ visitId });
  }

  async findPendingUpload(): Promise<Photo[]> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName} WHERE syncStatus IN (?, ?);`,
      ['local', 'failed']
    );

    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
