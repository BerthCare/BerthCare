export type SchemaDefinition = {
  tables: string[];
  indexes: string[];
};

export const CREATE_TABLE_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    caregiverId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    scheduledDate TEXT NOT NULL,
    scheduledTime TEXT NOT NULL,
    durationMinutes INTEGER NOT NULL CHECK (durationMinutes > 0),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    completedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photoUrl TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    emergencyContact TEXT,
    organizationId TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1)),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    scheduleId TEXT NOT NULL,
    caregiverId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    visitDate TEXT NOT NULL,
    startTime TEXT,
    endTime TEXT,
    documentation TEXT NOT NULL DEFAULT '{}',
    photoIds TEXT NOT NULL DEFAULT '[]',
    location TEXT,
    changedFields TEXT NOT NULL DEFAULT '[]',
    copiedFromVisitId TEXT,
    syncStatus TEXT NOT NULL DEFAULT 'local' CHECK (syncStatus IN ('local', 'syncing', 'synced', 'conflict')),
    syncedAt TEXT,
    syncVersion INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    visitId TEXT NOT NULL,
    clientId TEXT NOT NULL,
    caregiverId TEXT NOT NULL,
    localPath TEXT,
    s3Key TEXT,
    mimeType TEXT NOT NULL,
    sizeBytes INTEGER NOT NULL CHECK (sizeBytes >= 0),
    compressedSizeBytes INTEGER NOT NULL CHECK (compressedSizeBytes >= 0),
    width INTEGER NOT NULL CHECK (width >= 0),
    height INTEGER NOT NULL CHECK (height >= 0),
    syncStatus TEXT NOT NULL DEFAULT 'local' CHECK (syncStatus IN ('local', 'uploading', 'synced', 'failed')),
    uploadedAt TEXT,
    createdAt TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL CHECK (entityType IN ('schedule', 'client', 'visit', 'photo', 'alert')),
    entityId TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    payload TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    lastAttemptAt TEXT,
    createdAt TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    errorMessage TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'synced')),
    actorId TEXT NOT NULL,
    actorType TEXT NOT NULL CHECK (actorType IN ('caregiver', 'coordinator', 'system')),
    before TEXT,
    after TEXT,
    deviceId TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );`,
];

export const CREATE_INDEX_STATEMENTS: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_schedules_caregiver_date ON schedules (caregiverId, scheduledDate);`,
  `CREATE INDEX IF NOT EXISTS idx_clients_org_active ON clients (organizationId, isActive);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_schedule_id ON visits (scheduleId);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_client_date ON visits (clientId, visitDate DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_sync_status ON visits (syncStatus);`,
  `CREATE INDEX IF NOT EXISTS idx_visits_caregiver ON visits (caregiverId);`,
  `CREATE INDEX IF NOT EXISTS idx_photos_visit_id ON photos (visitId);`,
  `CREATE INDEX IF NOT EXISTS idx_photos_sync_status ON photos (syncStatus);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status_priority ON sync_queue (status, priority);`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue (entityType, entityId);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entityType, entityId);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (createdAt);`,
];

export const schema: SchemaDefinition = {
  tables: CREATE_TABLE_STATEMENTS,
  indexes: CREATE_INDEX_STATEMENTS,
};
