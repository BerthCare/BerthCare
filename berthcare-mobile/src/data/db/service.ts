import { close, getDatabase, initialize, isInitialized } from './manager';
import type { DatabaseHandle } from './manager';
import {
  AuditLogRepository,
  ClientRepository,
  PhotoRepository,
  ScheduleRepository,
  SyncQueueRepository,
  VisitRepository,
} from './repositories';

export class DatabaseService {
  readonly schedules: ScheduleRepository;
  readonly clients: ClientRepository;
  readonly visits: VisitRepository;
  readonly photos: PhotoRepository;
  readonly syncQueue: SyncQueueRepository;
  readonly auditLogs: AuditLogRepository;

  constructor(dbProvider: () => DatabaseHandle = getDatabase) {
    this.schedules = new ScheduleRepository(dbProvider);
    this.clients = new ClientRepository(dbProvider);
    this.visits = new VisitRepository(dbProvider);
    this.photos = new PhotoRepository(dbProvider);
    this.syncQueue = new SyncQueueRepository(dbProvider);
    this.auditLogs = new AuditLogRepository(dbProvider);
  }

  async initialize(): Promise<void> {
    await initialize();
  }

  close(): void {
    close();
  }

  isReady(): boolean {
    return isInitialized();
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const db = getDatabase();
    if (typeof db.transaction !== 'function') {
      throw new Error('Database does not support transactions');
    }

    let result: T | undefined;
    await db.transaction(async () => {
      result = await callback();
    });
    return result as T;
  }
}
