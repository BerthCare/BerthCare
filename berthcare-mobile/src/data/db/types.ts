export type ISODateString = string;
export type ISODateTimeString = string;

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Schedule {
  id: string;
  caregiverId: string;
  clientId: string;
  scheduledDate: ISODateString;
  scheduledTime: string;
  durationMinutes: number;
  status: ScheduleStatus;
  completedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type CreateScheduleInput = {
  id: string;
  caregiverId: string;
  clientId: string;
  scheduledDate: ISODateString;
  scheduledTime: string;
  durationMinutes: number;
  status?: ScheduleStatus;
  completedAt?: ISODateTimeString | null;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type UpdateScheduleInput = Partial<
  Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'status'>
> & {
  status?: ScheduleStatus;
  completedAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString;
};

export interface Client {
  id: string;
  name: string;
  photoUrl: string | null;
  address: string;
  phone: string | null;
  emergencyContact: string | null;
  organizationId: string;
  isActive: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type CreateClientInput = {
  id: string;
  name: string;
  address: string;
  organizationId: string;
  photoUrl?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  isActive?: boolean;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type UpdateClientInput = Partial<
  Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
> & {
  updatedAt?: ISODateTimeString;
};

export type VisitSyncStatus = 'local' | 'syncing' | 'synced' | 'conflict';

export interface VisitLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: ISODateTimeString | null;
}

export interface Visit {
  id: string;
  scheduleId: string;
  caregiverId: string;
  clientId: string;
  visitDate: ISODateString;
  startTime: string | null;
  endTime: string | null;
  documentation: Record<string, unknown>;
  photoIds: string[];
  location: VisitLocation | null;
  changedFields: string[];
  copiedFromVisitId: string | null;
  syncStatus: VisitSyncStatus;
  syncedAt: ISODateTimeString | null;
  syncVersion: number;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type CreateVisitInput = {
  id: string;
  scheduleId: string;
  caregiverId: string;
  clientId: string;
  visitDate: ISODateString;
  documentation?: Record<string, unknown>;
  photoIds?: string[];
  location?: VisitLocation | null;
  changedFields?: string[];
  copiedFromVisitId?: string | null;
  syncStatus?: VisitSyncStatus;
  syncedAt?: ISODateTimeString | null;
  syncVersion?: number;
  startTime?: string | null;
  endTime?: string | null;
  createdAt?: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type UpdateVisitInput = Partial<
  Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>
> & {
  documentation?: Record<string, unknown>;
  photoIds?: string[];
  changedFields?: string[];
  location?: VisitLocation | null;
  updatedAt?: ISODateTimeString;
};

export type PhotoSyncStatus = 'local' | 'uploading' | 'synced' | 'failed';

export interface Photo {
  id: string;
  visitId: string;
  clientId: string;
  caregiverId: string;
  localPath: string | null;
  s3Key: string | null;
  mimeType: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  syncStatus: PhotoSyncStatus;
  uploadedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export type CreatePhotoInput = {
  id: string;
  visitId: string;
  clientId: string;
  caregiverId: string;
  mimeType: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
  localPath?: string | null;
  s3Key?: string | null;
  syncStatus?: PhotoSyncStatus;
  uploadedAt?: ISODateTimeString | null;
  createdAt?: ISODateTimeString;
};

export type UpdatePhotoInput = Partial<
  Omit<Photo, 'id' | 'createdAt'>
> & {
  uploadedAt?: ISODateTimeString | null;
};

export type SyncQueueEntityType = 'schedule' | 'client' | 'visit' | 'photo' | 'alert';
export type SyncQueueOperation = 'create' | 'update' | 'delete';
export type SyncQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncQueueItem {
  id: string;
  entityType: SyncQueueEntityType;
  entityId: string;
  operation: SyncQueueOperation;
  payload: string;
  priority: number;
  attempts: number;
  lastAttemptAt: ISODateTimeString | null;
  status: SyncQueueStatus;
  errorMessage: string | null;
  createdAt: ISODateTimeString;
}

export type CreateSyncQueueInput = {
  id: string;
  entityType: SyncQueueEntityType;
  entityId: string;
  operation: SyncQueueOperation;
  payload: string;
  priority?: number;
  attempts?: number;
  lastAttemptAt?: ISODateTimeString | null;
  status?: SyncQueueStatus;
  errorMessage?: string | null;
  createdAt?: ISODateTimeString;
};

export type UpdateSyncQueueInput = Partial<
  Omit<SyncQueueItem, 'id' | 'createdAt'>
> & {
  lastAttemptAt?: ISODateTimeString | null;
  errorMessage?: string | null;
};

export type AuditLogAction = 'created' | 'updated' | 'deleted' | 'synced';
export type AuditLogActorType = 'caregiver' | 'coordinator' | 'system';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditLogAction;
  actorId: string;
  actorType: AuditLogActorType;
  before: string | null;
  after: string | null;
  deviceId: string;
  createdAt: ISODateTimeString;
}

export type CreateAuditLogInput = {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditLogAction;
  actorId: string;
  actorType: AuditLogActorType;
  deviceId: string;
  before?: string | null;
  after?: string | null;
  createdAt?: ISODateTimeString;
};

// Audit logs are append-only; updates are not supported.
export type UpdateAuditLogInput = never;
