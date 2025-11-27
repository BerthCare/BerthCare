# Offline Sync: Implementation

## Sync Queue Architecture

**SQLite table:**
```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL, -- 'visit', 'photo', 'alert'
  entityId TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'create', 'update', 'delete'
  priority INTEGER NOT NULL, -- 1=high, 2=medium, 3=low
  attempts INTEGER DEFAULT 0,
  lastAttemptAt INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
  error TEXT,
  createdAt INTEGER NOT NULL
);
```

**Processing:**
1. Query pending items (ORDER BY priority ASC, createdAt ASC)
2. Process up to 10 items concurrently
3. Update status on success/failure
4. Exponential backoff on failure: `min(2^attempts * 1000, 60000)` ms
5. Max 5 attempts, then mark as failed

**Code example:**
```typescript
const processSyncQueue = async () => {
  const items = await db.query(
    'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY priority ASC, createdAt ASC LIMIT 10'
  );

  for (const item of items) {
    try {
      await db.update('sync_queue', item.id, { status: 'syncing' });
      
      if (item.entityType === 'visit') {
        await syncVisit(item.entityId);
      } else if (item.entityType === 'photo') {
        await syncPhoto(item.entityId);
      } else if (item.entityType === 'alert') {
        await syncAlert(item.entityId);
      }

      await db.update('sync_queue', item.id, { status: 'synced' });
      await db.delete('sync_queue', item.id);
    } catch (error) {
      const attempts = item.attempts + 1;
      const backoff = Math.min(Math.pow(2, attempts) * 1000, 60000);
      
      await db.update('sync_queue', item.id, {
        status: attempts >= 5 ? 'failed' : 'pending',
        attempts,
        lastAttemptAt: Date.now(),
        error: error.message,
      });

      if (attempts < 5) {
        setTimeout(() => processSyncQueue(), backoff);
      }
    }
  }
};
```

---

## Conflict Resolution

**Strategy:** Last-write-wins (simple, predictable)

**Process:**
1. Client sends `syncVersion` with update
2. Server compares with current version
3. If match: Accept update, increment version
4. If mismatch: Return conflict error
5. Client compares timestamps
6. Newer timestamp wins
7. Log conflict in audit log

---

## Testing Checklist

- [ ] Works offline (7 days)
- [ ] Auto-saves after 2 seconds
- [ ] Background sync when online
- [ ] Sync queue processes correctly
- [ ] Exponential backoff on failure
- [ ] Conflict resolution works
- [ ] No data loss
- [ ] Sync status always accurate

---

**See onboarding-empty-states folder for first-run experience.**
