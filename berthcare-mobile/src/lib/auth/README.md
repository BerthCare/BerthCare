# Auth Service (Mobile)

Centralized auth module for the BerthCare mobile app. Handles secure token storage, refresh, and auth state restoration.

## Overview

- Secure storage via `react-native-keychain` (iOS Keychain, Android Keystore).
- Automatic access token refresh and 401 single-flight handling (via API client integration).
- Auth state restoration on app launch.
- Offline grace handling for limited connectivity.

## Architecture Alignment

- Technical Blueprint Section 5 (Flow 1: App Launch and Schedule Retrieval): [Flow 1](../../../../project-documentation/technical-blueprint.md#flow-1-app-launch-and-schedule-retrieval).
- Technical Blueprint Section 6 (Security: "Your data is safe"): [Security](../../../../project-documentation/technical-blueprint.md#security-your-data-is-safe).
- Deviations: none noted for this feature.

## Security Validation Notes

- Storage uses `react-native-keychain` with AES-GCM and after-first-unlock device-only accessibility.
- Hardware-backed security is requested with software fallback; cloud sync is disabled.
- Tokens are never stored in AsyncStorage or plaintext files.

## Configure Once at App Startup

Call `AuthService.configure` once and reuse the singleton:

```ts
import { AuthService, secureStorage } from '@/lib/auth';
import { ApiClient, createDefaultConfig } from '@/lib/api';

const apiClient = ApiClient.configure(createDefaultConfig());

AuthService.configure({
  apiClient,
  secureStorage,
  deviceId: 'persistent-device-id',
  offlineGracePeriodDays: 7, // optional
});

// Optional: restore auth state on startup
await AuthService.getInstance().restoreAuthState();
```

Notes:

- `deviceId` must be a stable, device-bound identifier (see P0-LIB-003).
- If you use a custom API client wrapper, ensure it exposes `setTokenProvider`.

## Login

```ts
import { AuthService } from '@/lib/auth';

const authService = AuthService.getInstance();
const result = await authService.login(email, password);

if (result.success) {
  // Navigate to main app
} else {
  // Use result.error?.type for UX messaging
}
```

## Access Tokens (Automatic Refresh)

```ts
const authService = AuthService.getInstance();
const token = await authService.getAccessToken();

if (token) {
  // Use token for API calls
} else {
  // Requires re-authentication or offline handling
}
```

## Logout

```ts
await AuthService.getInstance().logout();
```

## Offline Grace Period (7-Day Window)

The auth service implements a 7-day offline grace period that allows caregivers to continue working offline for up to 7 days after their access token expires. This enables rural users with intermittent connectivity to keep working without losing progress.

### How It Works

1. **Grace Window**: Based on `ACCESS_TOKEN_EXPIRY` timestamp stored in secure storage.
2. **Within Grace** (token expired <7 days ago, offline): 
   - Full cached access allowed
   - No login prompt
   - Auth state: `{ isAuthenticated: true, isOffline: true, requiresReauth: false }`
3. **Beyond Grace** (token expired ≥7 days ago, offline):
   - "Connect to internet to continue" banner shown (global, dismissible)
   - Cached data viewable (read-only)
   - Write actions disabled
4. **Back Online**: Automatic token refresh attempted; soft block cleared on success, routed to Login on failure

### Configuration

```ts
AuthService.configure({
  apiClient,
  secureStorage,
  deviceId: 'persistent-device-id',
  offlineGracePeriodDays: 7, // Default: 7 days. Customize if needed.
});
```

### Check Offline Access

```ts
const authService = AuthService.getInstance();
const { canContinue, readOnly, reason } = await authService.checkOfflineAccess();

if (!canContinue) {
  // User is offline and grace expired
  // reason: 'OfflineGracePeriodExpired' | 'NoTokens' | 'TokensExpired'
  // Display soft block banner and enforce read-only mode
}

if (readOnly) {
  // Grace is expired; disable write actions in UI
}
```

### Is Within Grace?

```ts
const withinGrace = await authService.isWithinOfflineGracePeriod();
if (withinGrace && authState.isOffline) {
  // Show "offline" indicator, allow normal access
}
```

### UI Integration

#### Banner Display
```ts
// In App.tsx or global shell
<OfflineGraceBanner
  visible={
    offlineAccess.reason === 'OfflineGracePeriodExpired' &&
    offlineAccess.canContinue === false
  }
  onDismiss={() => setBannerDismissed(true)}
/>
```

**Important**: Banner dismissal does NOT re-enable write actions. Dismissal only hides the banner; read-only enforcement continues.

#### Read-Only Enforcement
```ts
import { canPerformWrites, getReadOnlyMessage } from '@/lib/offline-access';

const writesAllowed = canPerformWrites(offlineAccess);
const readOnlyMsg = getReadOnlyMessage(offlineAccess);

if (!writesAllowed) {
  // Disable form inputs, buttons, sync actions
  // Show read-only indicator or overlay
}

if (readOnlyMsg) {
  // Display message explaining why writes are disabled
}
```

### Connectivity Recovery

The app automatically monitors connectivity and attempts token refresh when the device comes back online:

1. **Connectivity Detected**: `useConnectivityMonitor()` hook fires callback
2. **Refresh Attempted**: `authService.refreshTokens()` called
3. **Success**: 
   - Soft block cleared
   - Offline access re-evaluated
   - Write access restored
4. **Failure**:
   - User logged out
   - Navigation reset to Login
   - Auth state cleared

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Token expiry missing/corrupt | Treat as expired; require network |
| Device clock skew | 5-minute buffer applied to avoid flapping |
| No tokens stored | Grace not applicable; require login |
| Network flapping | State stable until successful refresh |
| Secure storage read error | Surface auth error; avoid partial state |

### Storage Keys

Offline grace relies on these secure storage keys:

- `STORAGE_KEYS.ACCESS_TOKEN_EXPIRY`: Timestamp (ms) when access token expires
- `STORAGE_KEYS.LAST_ONLINE_TIMESTAMP`: Timestamp of last successful online operation

See [secure-storage.ts](./secure-storage.ts) for complete key list.

### Testing Offline Grace

```ts
// Example: simulate 3-day expired token offline
import { secureStorage, STORAGE_KEYS } from '@/lib/auth';

const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, threeDaysAgo.toString());

// Within grace: should allow access
const result = await authService.checkOfflineAccess();
expect(result.canContinue).toBe(true);

// Example: simulate 9-day expired token
const nineDaysAgo = Date.now() - 9 * 24 * 60 * 60 * 1000;
await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, nineDaysAgo.toString());

// Beyond grace: should show soft block
const result2 = await authService.checkOfflineAccess();
expect(result2.canContinue).toBe(false);
expect(result2.reason).toBe('OfflineGracePeriodExpired');
```

### Related Documentation

- [Technical Blueprint: UX Guardrail 4 (Offline always works)](../../../../project-documentation/technical-blueprint.md#the-10-inviolable-ux-guardrails)
- [Technical Blueprint: Offline Capability](../../../../project-documentation/technical-blueprint.md#offline-capability-it-works-everywhere)
- [Feature Spec: 7-Day Offline Grace Period](../../../../berthcare-spec/specs/004-offline-grace-period-mobile/spec.md)



## Error Handling

Use `AuthError` for auth-specific failures:

```ts
import { AuthError } from '@/lib/auth';

try {
  await AuthService.getInstance().refreshToken();
} catch (error) {
  if (AuthError.isAuthError(error)) {
    switch (error.type) {
      case 'InvalidCredentials':
      case 'TokenExpired':
      case 'TokenRevoked':
        // prompt login
        break;
      case 'NetworkError':
        // show offline warning
        break;
      default:
        break;
    }
  }
}
```

## Testing

Relevant unit tests live under:

- `src/lib/auth/__tests__/auth-service.test.ts`
- `src/lib/auth/__tests__/auth-service.property.ts`
- `src/lib/auth/__tests__/secure-storage.property.ts`
