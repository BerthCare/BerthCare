# Offline Sync: Screen States

## Saved Locally (Offline)

Sync indicator: Gray cloud + "Saved locally". Everything works normally.

---

## Syncing (In Progress)

Sync indicator: Blue spinner + "Syncing...". Non-blocking, user can continue working.

---

## Synced (Success)

Sync indicator: Green checkmark + "Synced". All data on server.

---

## Sync Failed (Error)

Sync indicator: Red exclamation + "Sync failed". Error banner with retry button. Auto-retry every 30 seconds.

---

See implementation.md for sync queue management and conflict resolution.
