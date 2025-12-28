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

## Offline Access

```ts
const { canContinue, reason } = await AuthService.getInstance().checkOfflineAccess();
if (!canContinue) {
  // reason: 'OfflineGracePeriodExpired' | 'NoTokens' | 'TokensExpired'
}
```

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
