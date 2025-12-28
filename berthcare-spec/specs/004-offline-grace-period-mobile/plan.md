# Implementation Plan: Implement 7-Day Offline Grace Period (Mobile)

**Branch**: `004-offline-grace-period-mobile` | **Date**: 2025-12-28 | **Spec**: specs/004-offline-grace-period-mobile/spec.md  
**Input**: Feature specification from `specs/004-offline-grace-period-mobile/spec.md` with Technical Blueprint as primary context.

## Summary

Add a 7-day offline grace period for mobile authentication based on stored token expiry data. When offline and within grace, allow full access to cached data without refresh. When offline beyond grace, show a dismissible "Connect to internet to continue" message and enforce read-only mode until connectivity returns and refresh succeeds. Integrate with the existing AuthService and app bootstrap flow, and back the logic with unit tests.

## Technical Context

**Language/Version**: TypeScript 5.9 (React Native via Expo 54)  
**Primary Dependencies**: AuthService (`src/lib/auth`), secure storage (`react-native-keychain`), API client (`src/lib/api`); add network status signal only if needed (NetInfo or Expo network utilities).  
**Storage**: Secure storage for tokens and expiry timestamps; SQLite cache for schedule/visit data.  
**Testing**: Jest + `@testing-library/react-native` for auth logic and UI state tests.  
**Target Platform**: iOS + Android (Expo dev client + native builds).  
**Project Type**: Mobile client (offline-first).  
**Performance Goals**: App launch to Today <1s; offline grace checks are local and non-blocking.  
**Constraints**: 7-day offline grace; no hard "no internet" blocks; dismissible soft block; read-only mode when grace expired.

## Constitution Check

- No constitution file found; using Technical Blueprint guardrails:
  - Offline always works (pass: soft block only after grace, cached data viewable).
  - 7-day offline grace for authentication (pass: offline decisioning by expiry timestamps).
  - App opens to Today in <1s (pass: checks are local; no network dependency on launch).
  - No hard "no internet" modals (pass: inline or banner message).
- Action: Add a constitution file when principles are formalized.

## Project Structure

### Documentation (this feature)

```text
specs/004-offline-grace-period-mobile/
|-- spec.md          # Feature specification
|-- plan.md          # This file
`-- tasks.md         # Generated in next step
```

### Source Code (repository)

```text
berthcare-mobile/
|-- src/
|   |-- lib/
|   |   `-- auth/
|   |       |-- auth.ts             # Offline grace checks + auth state updates
|   |       `-- types.ts            # Auth state/offline decision types if needed
|   |-- components/
|   |   `-- OfflineGraceBanner.tsx  # Dismissible soft block message (new)
|   |-- screens/
|   |   |-- today/
|   |   |   `-- screen.tsx          # Show offline grace message, read-only mode
|   |   `-- visit/
|   |       `-- screen.tsx          # Read-only guard for edits (if applicable)
|   |-- App.tsx                     # Bootstrap offline grace evaluation
|   `-- navigation/
|       `-- RootNavigator.tsx       # Route gating when online vs offline
`-- src/__tests__/                  # Auth + UI tests for offline grace
```

**Structure Decision**: Mobile-only updates within the existing AuthService and app shell. No new services.

## Phase 0: Research & Decisions

- Confirm offline detection approach (NetInfo vs API error signals) and where to surface it.
- Decide UX pattern for the soft block message (banner or inline callout; avoid modal per design system).
- Define scope of read-only mode (disable edits, creation, and sync actions while grace expired).

## Phase 1: Offline Grace Decisioning

- Update `AuthService` to evaluate offline grace using stored access token expiry timestamps.
- Ensure `restoreAuthState` handles offline cases without forcing login when within grace.
- Add a small buffer for clock skew around the 7-day boundary.
- Expose offline access decision to the UI (via `AuthState` or a separate `OfflineAccessState`).

## Phase 2: UI Soft Block + Read-Only Mode

- Create a dismissible "Connect to internet to continue" banner/callout.
- Wire the banner to show only when offline and grace is expired.
- Enforce read-only mode in Today and Visit flows (disable edits, prevent new actions, keep cached views).
- Ensure message dismissal does not remove the read-only guard.

## Phase 3: Connectivity Recovery

- When network returns, attempt token refresh; clear soft block on success.
- If refresh fails, route to Login and clear auth state per policy.
- Update last online timestamp on successful refresh (and optionally on successful API calls).

## Phase 4: Tests & QA

- Unit tests for offline grace decisions (within grace, expired, missing expiry, missing tokens).
- UI tests for banner display, dismissal behavior, and read-only enforcement.
- Manual QA: toggle offline/online, verify launch behavior and recovery flow.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | -          | -                                    |
