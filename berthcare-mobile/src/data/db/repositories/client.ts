import { getDatabase, type DatabaseHandle } from '../manager';
import { BaseRepository } from './base';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

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

export class ClientRepository extends BaseRepository<Client, CreateClientInput, UpdateClientInput> {
  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    super('clients', {}, dbProvider);
  }

  protected serializeRecord(data: Record<string, unknown>): Record<string, unknown> {
    const serialized = super.serializeRecord(data);
    if (serialized.isActive !== undefined) {
      serialized.isActive = serialized.isActive ? 1 : 0;
    }
    return serialized;
  }

  protected deserializeRecord(row: Row): Client {
    const deserialized = super.deserializeRecord(row) as Client & { isActive?: number | boolean };
    if (deserialized.isActive !== undefined) {
      deserialized.isActive = Boolean(deserialized.isActive);
    }
    return deserialized as Client;
  }

  async findByOrganization(organizationId: string): Promise<Client[]> {
    return this.findAll({ organizationId });
  }

  async findActive(): Promise<Client[]> {
    const db = this.getDb();
    const result = await db.executeAsync(`SELECT * FROM ${this.tableName} WHERE isActive = ?;`, [
      1,
    ]);
    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }
}
