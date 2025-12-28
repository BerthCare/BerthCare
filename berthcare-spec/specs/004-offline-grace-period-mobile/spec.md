# Feature Specification: Implement 7-Day Offline Grace Period (Mobile)

**Feature Branch**: `004-offline-grace-period-mobile`  
**Created**: 2025-12-28  
**Status**: Draft  
**Input**: User description: "P1-AUTH-004 Implement 7-Day Offline Grace Period (Mobile): allow app to function offline for 7 days without token refresh. Store token expiry timestamp locally. If offline and token expired <7 days ago, allow access. If offline and token expired >7 days ago, show 'Connect to internet to continue' message (soft block). Message is dismissible (user can view cached data read-only). Unit tests for grace period logic. Dependency P1-AUTH-002." Primary context: [Technical Blueprint](../../../project-documentation/technical-blueprint.md) (UX Guardrail 4: Offline always works; Offline Capability).

## Experience Principles (Guardrail 4)

- **Offline always works**: No hard blocks for lack of connectivity. Only a soft block after 7-day grace.
- **Clarity without friction**: Short, clear "Connect to internet to continue" message that can be dismissed.
- **Predictable recovery**: Reconnect triggers refresh; if refresh fails, route to login.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep working offline within grace period (Priority: P1)

A caregiver loses connectivity and can keep working for up to 7 days after token expiry without re-authentication.

**Why this priority**: Rural caregivers may have no service for days; work must continue offline.

**Independent Test**: Simulate offline state with stored tokens and access token expired 3 days ago. App should open to Today, show offline state, and avoid login prompts.

**Acceptance Scenarios**:

1. **Given** the device is offline and the access token expired less than 7 days ago, **When** the app launches, **Then** it allows access to cached data without forcing login and marks the session as offline.
2. **Given** the device is offline and the access token is still valid, **When** the app launches, **Then** it allows access with no blocking message.

---

### User Story 2 - Soft block after offline grace expires (Priority: P1)

A caregiver who has been offline beyond the grace period sees a clear message but can still review cached data.

**Why this priority**: Security tradeoff is acceptable, but we must still avoid a hard stop.

**Independent Test**: Set access token expiry to 9 days ago and simulate offline mode. App should show the "Connect to internet to continue" message and allow dismiss to view cached data read-only.

**Acceptance Scenarios**:

1. **Given** the device is offline and the access token expired more than 7 days ago, **When** the app launches, **Then** it shows a dismissible "Connect to internet to continue" message and prevents edits (read-only).
2. **Given** the user dismisses the message, **When** they continue using the app offline, **Then** cached data remains viewable but all write actions stay disabled until connectivity returns.

---

### User Story 3 - Recover when connectivity returns (Priority: P2)

The app returns to normal operation once the device is back online.

**Why this priority**: The soft block should resolve automatically without user confusion.

**Independent Test**: While in soft block state, restore connectivity and ensure the app attempts refresh and restores full access on success.

**Acceptance Scenarios**:

1. **Given** the device reconnects after a grace-expired offline period, **When** the app detects connectivity, **Then** it attempts token refresh and clears the soft block if refresh succeeds.
2. **Given** refresh fails due to expired or revoked tokens, **When** connectivity returns, **Then** the app routes to Login and clears cached auth state per policy.

---

### Edge Cases

- Token expiry timestamp missing or corrupt: treat as expired and require network connection to continue.
- Device clock skew: apply a small buffer to avoid flapping around the 7-day boundary.
- No tokens at all: route to Login regardless of offline state.
- Network flapping: avoid repeatedly showing/dismissing the soft block; keep state stable until a successful refresh.
- Secure storage read errors: surface a generic auth error and avoid partial state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile app MUST store access token expiry timestamp locally in secure storage and persist it across restarts.
- **FR-002**: The app MUST detect offline state and evaluate offline access using stored token expiry data without requiring a network call.
- **FR-003**: If offline and the access token expired less than 7 days ago, the app MUST allow access to cached data without forcing login and MUST set auth state to authenticated + offline.
- **FR-004**: If offline and the access token expired 7 days or more ago (or expiry is missing), the app MUST show a dismissible "Connect to internet to continue" message and enforce read-only mode.
- **FR-005**: The soft block message MUST be dismissible and accessible; dismissal MUST NOT enable write actions while offline grace is expired.
- **FR-006**: When connectivity returns, the app MUST attempt token refresh; on success it MUST restore normal access, on failure it MUST require re-authentication.
- **FR-007**: Unit tests MUST cover offline grace logic (within grace, beyond grace, missing expiry, no tokens).
- **FR-008**: The implementation MUST honor dependency P1-AUTH-002 and store all auth data only in secure storage.
- **FR-009**: The implementation MUST align with Technical Blueprint guardrails for offline behavior and auth handling.

### Architecture Alignment

- Technical Blueprint Section 2 (UX Guardrail 4: Offline always works): [Guardrails](../../../project-documentation/technical-blueprint.md#the-10-inviolable-ux-guardrails).
- Technical Blueprint Section 6 (Offline Capability): [Offline Capability](../../../project-documentation/technical-blueprint.md#offline-capability-it-works-everywhere).
- Technical Blueprint Section 5 (Flow 1: App Launch and Schedule Retrieval): [Flow 1](../../../project-documentation/technical-blueprint.md#flow-1-app-launch-and-schedule-retrieval).
- Design reference: [Today Schedule implementation](../../../design-documentation/features/today-schedule/implementation.md) (offline for 7+ days, read-only).
- Dependencies: P1-AUTH-002 (secure token storage and AuthService).

### Key Entities *(include if feature involves data)*

- **Access Token Expiry**: Stored timestamp used to compute offline grace window.
- **Offline Grace Window**: 7-day period after access token expiry during which cached data remains usable.
- **Offline Access Decision**: `{ canContinue: boolean, reason?: 'OfflineGracePeriodExpired' | 'NoTokens' | 'TokensExpired' }`.
- **Read-Only Mode**: UI state that allows viewing cached data but disables edits and sync actions.

### Assumptions

- Secure storage and AuthService from P1-AUTH-002 are available and stable.
- Cached schedule and visit data exist locally for read-only viewing.
- Connectivity status can be determined reliably (network status or API error signals).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of offline sessions within 7 days of token expiry reach the Today screen without a login prompt.
- **SC-002**: 100% of offline sessions beyond 7 days show the "Connect to internet to continue" message and enforce read-only mode.
- **SC-003**: Unit tests cover all offline grace decision paths and pass consistently in CI.
