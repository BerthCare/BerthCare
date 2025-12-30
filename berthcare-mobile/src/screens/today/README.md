# Today Screen

The Today screen displays the care worker's current schedule and work status for the day. It supports offline access with read-only enforcement during the offline grace period.

## Overview

- **Component**: [screen.tsx](./screen.tsx)
- **Purpose**: Display today's visits/tasks, allow scheduling actions, and manage care worker status
- **Offline Behavior**: Displays cached data in read-only mode if offline and within the 7-day grace period

## Architecture & Integration

### Offline Grace Period (P1-AUTH-004)

The Today screen respects the offline grace period defined in [ARCHITECTURE.md](../../ARCHITECTURE.md#offline-grace-period-p1-auth-004):

1. **Read-Only Enforcement**: When offline and within the grace period, the screen enforces read-only mode using helper functions from [src/lib/offline-access.ts](../../lib/offline-access.ts):
   - `canPerformWrites(state)` – returns `false` when offline
   - `getReadOnlyMessage(state)` – returns explanatory message for UI display

2. **UI Indicators**: 
   - Read-only warning banner displays when `canPerformWrites()` returns `false`
   - All mutation buttons (schedule visit, update status, etc.) are disabled
   - User can still view cached data and read-only details

3. **Recovery Flow**: When connectivity is restored:
   - The `useConnectivityMonitor()` hook (from [src/lib/connectivity.ts](../../lib/connectivity.ts)) detects the online transition
   - Token refresh is triggered automatically
   - If refresh succeeds, read-only mode is cleared and writes are re-enabled
   - If refresh fails (grace expired), user is routed to Login screen

### Related Components

- **Global Offline Banner**: [src/components/OfflineGraceBanner.tsx](../../components/OfflineGraceBanner.tsx) – Global soft-block banner displayed in App shell
- **Auth Service**: [src/lib/auth/auth.ts](../../lib/auth/auth.ts) – Provides `checkOfflineAccess()` and `refreshTokens()` methods
- **Read-Only Helpers**: [src/lib/offline-access.ts](../../lib/offline-access.ts) – Provides `canPerformWrites()` and `getReadOnlyMessage()` helpers

## State Management

The screen receives offline access state from the App context (set in [src/App.tsx](../../App.tsx)):

```typescript
interface OfflineAccessState {
  canContinue: boolean;      // Can enter authenticated screens
  readOnly: boolean;         // Are we in read-only mode?
  reason: string | null;     // Why are we read-only (if applicable)?
}
```

## Testing

Key test scenarios for offline behavior:

1. **Online user can perform writes** – `canPerformWrites()` returns `true`, buttons enabled
2. **Offline user within grace can read but not write** – `canPerformWrites()` returns `false`, banner shown, buttons disabled
3. **Offline user beyond grace is routed to Login** – `canContinue` is `false` at app startup
4. **Reconnect triggers recovery flow** – Connectivity hook detects online transition, triggers refresh, re-enables writes

See [src/__tests__/screens/today.test.tsx](../../__tests__/screens/today.test.tsx) for test patterns.

## Technical Blueprint Alignment

- **Blueprint Section 2 (UX Guardrail 4)**: "Users see a clear, non-blocking message if offline and nearing grace expiry. Cached data remains readable."
- **Blueprint Section 5 (Flow 1)**: Today screen is the default post-launch navigation target for authenticated users.
- **Blueprint Section 2 (Offline Capability)**: Read-only data access on cached visits/tasks; write mutations blocked until reconnect.

## Related Documentation

- [ARCHITECTURE.md - Offline Grace Period](../../ARCHITECTURE.md#offline-grace-period-p1-auth-004) – Comprehensive offline grace design and implementation
- [AuthService README](../../lib/auth/README.md) – Offline grace API documentation with usage examples
- [CONNECTIVITY_RECOVERY.md](../../docs/CONNECTIVITY_RECOVERY.md) – Recovery flow implementation details
- [Offline Access Helpers](../../lib/offline-access.ts) – Read-only enforcement helper functions
