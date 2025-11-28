# BerthCare Database Schema

## Entity relationship overview

The Prisma schema (see `.kiro/specs/prisma-database-schema/design.md` for the diagram) defines:
- **Caregiver** ↔ **Schedule** (1:N) and **Caregiver** ↔ **Visit** (1:N)
- **Client** ↔ **Schedule** (1:N) and **Client** ↔ **Visit** (1:N)
- **Schedule** ↔ **Visit** (1:1) via `Schedule.visit` / `Visit.schedule`
- **Visit** ↔ **Photo** (1:N)
- **Caregiver** ↔ **Photo** (1:N) and **Client** ↔ **Photo** (1:N) for attribution
- **Alert** links a caregiver (initiator), coordinator, and client
- **Consent** links client with an optional caregiver (witness/collector)
- **AuditLog** tracks actions for any entity type with actor metadata

Key enums:
- `CaregiverRole`: caregiver | coordinator
- `ScheduleStatus`: scheduled | completed | cancelled
- `SyncStatus`: local | syncing | synced | conflict
- `PhotoSyncStatus`: local | uploading | synced | failed
- `ActorType`: caregiver | coordinator | system
- `ConsentType`: photo | documentation | location

## JSONB structures

- **Visit.documentation**: JSON object capturing clinical/visit notes. Nested objects are merged on partial updates; arrays are replaced by design. Example:
  ```json
  {
    "subjective": "Client feels well",
    "objective": {
      "bp": "120/80",
      "mobility": "independent"
    },
    "plan": ["monitor mobility"]
  }
  ```
- **Visit.location**: optional JSON with geolocation/context (e.g., `{"lat": 45.5, "lng": -73.6, "accuracy": 12}`).
- **Alert.location**: optional JSON describing where the alert was initiated.
- **AuditLog.before / AuditLog.after**: snapshots of entity state for audit; arbitrary JSON.

## Index strategy and query patterns

- `Caregiver`: `@@index([email])` for auth lookup by email.
- `Schedule`: `@@index([caregiverId, scheduledDate])` to fetch a caregiver’s daily schedule efficiently.
- `Visit`: `@@index([clientId, visitDate])` to fetch recent visits per client (copy/edit flow).
- `AuditLog`: `@@index([entityType, entityId])` to query audit trails for a specific entity.
- Unique keys: `Caregiver.email`, `Visit.scheduleId` enforce identity/one-visit-per-schedule.

## Migration and client generation

- Schema: `prisma/schema.prisma`
- Generate client: `npx prisma generate`
- Create migrations: `npx prisma migrate dev --name <migration_name>`
- Deploy migrations: `npx prisma migrate deploy`

Ensure `DATABASE_URL` is set for Prisma commands. Generated client lives in `src/generated/prisma`.
