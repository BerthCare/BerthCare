import { getDatabase, type DatabaseHandle } from '../manager';

export type JsonField = string;

export type BaseRepositoryOptions = {
  primaryKey?: string;
  jsonFields?: JsonField[];
};

type RecordObject = Record<string, unknown>;
type QueryResultRows = { rows?: { _array?: RecordObject[] } | RecordObject[] };

const rowsFromResult = (result: QueryResultRows): RecordObject[] => {
  const rows = result?.rows;
  if (Array.isArray(rows)) {
    return rows as RecordObject[];
  }
  if (rows && '_array' in rows && Array.isArray(rows._array)) {
    return rows._array as RecordObject[];
  }
  return [];
};

const serializeValue = (value: unknown): unknown => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value;
};

const stringifyJsonValue = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
};

export class BaseRepository<T extends object, CreateInput extends object, UpdateInput extends object> {
  protected readonly tableName: string;
  protected readonly primaryKey: string;
  protected readonly jsonFields: Set<string>;
  protected readonly dbProvider: () => DatabaseHandle;

  constructor(
    tableName: string,
    options: BaseRepositoryOptions = {},
    dbProvider: () => DatabaseHandle = getDatabase
  ) {
    this.tableName = tableName;
    this.primaryKey = options.primaryKey ?? 'id';
    this.jsonFields = new Set(options.jsonFields ?? []);
    this.dbProvider = dbProvider;
  }

  protected serializeRecord(data: RecordObject): RecordObject {
    const serialized: RecordObject = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      if (this.jsonFields.has(key)) {
        serialized[key] = stringifyJsonValue(value);
      } else {
        serialized[key] = serializeValue(value);
      }
    });

    return serialized;
  }

  protected deserializeRecord(row: RecordObject): T {
    const deserialized: RecordObject = { ...row };

    this.jsonFields.forEach((key) => {
      const value = row[key];
      if (typeof value === 'string') {
        try {
          deserialized[key] = JSON.parse(value);
        } catch {
          deserialized[key] = value;
        }
      }
    });

    return deserialized as T;
  }

  protected getDb(): DatabaseHandle {
    return this.dbProvider();
  }

  private assertHasPrimaryKey(data: RecordObject): void {
    if (data[this.primaryKey] === undefined) {
      throw new Error(`Missing primary key "${this.primaryKey}" in data`);
    }
  }

  async create(data: CreateInput): Promise<T> {
    const record = this.serializeRecord(data as RecordObject);
    this.assertHasPrimaryKey(record);

    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => record[col]);

    const db = this.getDb();
    await db.executeAsync(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders});`,
      values as unknown[]
    );

    const id = record[this.primaryKey] as string;
    const created = await this.findById(id);
    if (!created) {
      throw new Error(`Failed to fetch created record from ${this.tableName}`);
    }
    return created;
  }

  async findById(id: string): Promise<T | null> {
    const db = this.getDb();
    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1;`,
      [id]
    );
    const rows = rowsFromResult(result);
    if (rows.length === 0) return null;
    return this.deserializeRecord(rows[0]!);
  }

  async findAll(where?: Partial<T>): Promise<T[]> {
    const db = this.getDb();

    if (!where || Object.keys(where).length === 0) {
      const result = await db.executeAsync(`SELECT * FROM ${this.tableName};`);
      const rows = rowsFromResult(result);
      return rows.map((row) => this.deserializeRecord(row));
    }

    const serializedWhere = this.serializeRecord(where as RecordObject);
    const entries = Object.entries(serializedWhere).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      const result = await db.executeAsync(`SELECT * FROM ${this.tableName};`);
      const rows = rowsFromResult(result);
      return rows.map((row) => this.deserializeRecord(row));
    }

    const conditions = entries.map(([key]) => `${key} = ?`).join(' AND ');
    const values = entries.map(([, value]) => value);

    const result = await db.executeAsync(
      `SELECT * FROM ${this.tableName} WHERE ${conditions};`,
      values as unknown[]
    );
    const rows = rowsFromResult(result);
    return rows.map((row) => this.deserializeRecord(row));
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    const record = this.serializeRecord(data as RecordObject);
    const entries = Object.entries(record).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Record with id "${id}" not found in ${this.tableName}`);
      }
      return existing;
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    const db = this.getDb();
    await db.executeAsync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?;`,
      [...values, id] as unknown[]
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Record with id "${id}" not found after update in ${this.tableName}`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = this.getDb();
    await db.executeAsync(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?;`, [id]);
  }
}
