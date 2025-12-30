/**
 * Offline access decision and read-only mode helpers.
 *
 * Provides utilities to check if the user is in read-only mode
 * (e.g., offline beyond grace period) and thus cannot perform write actions.
 *
 * **Architecture Alignment**:
 * - Technical Blueprint Section 2 (UX Guardrail 4: "Offline always works"):
 *   https://github.com/BerthCare/docs#the-10-inviolable-ux-guardrails
 *   Implements "clarity without friction": dismissible message, cached data readable.
 *
 * - Technical Blueprint Section 5 (Flow 1: App Launch and Schedule Retrieval):
 *   https://github.com/BerthCare/docs#flow-1-app-launch-and-schedule-retrieval
 *   Supports read-only state during grace expiry without forcing login.
 *
 * **Usage**:
 * ```ts
 * import { canPerformWrites, getReadOnlyMessage } from '@/lib/offline-access';
 *
 * const writesAllowed = canPerformWrites(offlineAccess);
 * if (!writesAllowed) {
 *   const msg = getReadOnlyMessage(offlineAccess);
 *   // Disable form inputs, show message
 * }
 * ```
 *
 * **Related Code**:
 * - `src/lib/auth/auth.ts` — Computes offline access state
 * - `src/screens/today/screen.tsx` — Uses helpers for read-only enforcement
 * - `src/screens/visit/screen.tsx` — Uses helpers for read-only enforcement
 */

export type OfflineAccessState = {
  canContinue: boolean;
  readOnly: boolean;
  reason?: 'OfflineGracePeriodExpired' | 'NoTokens' | 'TokensExpired';
};

/**
 * Check if the user can perform write actions (edits, creation, sync).
 * Returns false if offline and grace period has expired (read-only mode).
 *
 * @param offlineAccess Offline access decision state
 * @returns true if writes are allowed, false if read-only
 */
export function canPerformWrites(offlineAccess?: OfflineAccessState): boolean {
  if (!offlineAccess) {
    // No offline state means online or uninitialized; allow writes
    return true;
  }

  // If readOnly is true, writes are disabled
  return !offlineAccess.readOnly;
}

/**
 * Get a user-friendly message explaining why writes are disabled.
 * Returns empty string if writes are allowed.
 *
 * @param offlineAccess Offline access decision state
 * @returns Message or empty string
 */
export function getReadOnlyMessage(offlineAccess?: OfflineAccessState): string {
  if (!offlineAccess || !offlineAccess.readOnly) {
    return '';
  }

  switch (offlineAccess.reason) {
    case 'OfflineGracePeriodExpired':
      return 'You are offline and your session has expired. Connect to internet to edit.';
    case 'NoTokens':
      return 'You are not authenticated. Sign in to make changes.';
    case 'TokensExpired':
      return 'Your session has expired. Sign in to make changes.';
    default:
      return 'You cannot make changes at this time.';
  }
}
