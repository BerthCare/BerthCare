# Offline Sync: Interactions

## Automatic Background Sync

**Trigger:** Network connection detected

Behavior:

1. Sync queue processes (FIFO with priority)
2. Visits sync first (high priority)
3. Photos sync second (lower priority)
4. Sync indicator updates in real-time
5. No user action required

---

## Manual Retry

**Trigger:** Tap "Retry" in error banner

Behavior:

1. Immediate sync attempt
2. Sync indicator shows "Syncing..."
3. Success or failure feedback

---

## Tap Sync Indicator

**Trigger:** Tap sync status indicator

Behavior:

1. Sync details modal appears
2. Shows sync queue status
3. Shows last sync time
4. Shows retry button (if failed)

---

See implementation.md for sync queue architecture.
