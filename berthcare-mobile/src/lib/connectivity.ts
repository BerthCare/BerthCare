/**
 * Connectivity state hook and utilities.
 *
 * Monitors device connectivity and triggers recovery actions when connectivity is restored.
 * Uses AppState and a simple HTTP ping to detect connectivity changes.
 *
 * **Architecture Alignment**:
 * - Technical Blueprint Section 2 (UX Guardrail 4: "Offline always works"):
 *   https://github.com/BerthCare/docs#the-10-inviolable-ux-guardrails
 *   Ensures no hard blocks for lack of connectivity; soft block only after grace period.
 *
 * - Technical Blueprint Section 6 (Offline Capability):
 *   https://github.com/BerthCare/docs#offline-capability-it-works-everywhere
 *   Implements predictable recovery pattern: reconnect → refresh → restore or route to login.
 *
 * **Related Code**:
 * - `src/lib/auth/auth.ts` — Token refresh logic triggered by this hook
 * - `src/App.tsx` — Integration point for recovery callback
 * - `src/lib/offline-access.ts` — Read-only enforcement during grace period
 */

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

export type ConnectivityState = 'online' | 'offline' | 'unknown';

/**
 * Simple ping to verify connectivity by attempting a HEAD request to a known endpoint.
 * Falls back to checking basic network status.
 *
 * @param testUrl URL to ping (e.g., https://www.google.com)
 * @returns true if device appears to be online, false otherwise
 */
async function isDeviceOnline(testUrl = 'https://www.google.com'): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 0;
  } catch (error) {
    // Network error means offline
    return false;
  }
}

/**
 * Hook to monitor device connectivity and trigger a callback when connectivity is restored.
 *
 * @param onConnectivityRestored Callback fired when device transitions from offline to online
 * @returns Current connectivity state
 */
export function useConnectivityMonitor(
  onConnectivityRestored?: () => void
): ConnectivityState {
  const [connectivity, setConnectivity] = useState<ConnectivityState>('unknown');
  const appStateRef = useRef(AppState.currentState);
  const lastOnlineRef = useRef(true);

  useEffect(() => {
    let appStateSubscription: ReturnType<typeof AppState.addEventListener>;
    let checkInterval: ReturnType<typeof setInterval>;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;

      if (nextAppState === 'active') {
        // App came to foreground; check connectivity
        const online = await isDeviceOnline();
        const wasOffline = !lastOnlineRef.current;

        setConnectivity(online ? 'online' : 'offline');
        lastOnlineRef.current = online;

        // Trigger recovery callback if transitioning from offline to online
        if (online && wasOffline && onConnectivityRestored) {
          console.log('[Connectivity] Device came online; triggering recovery callback');
          onConnectivityRestored();
        }
      }
    };

    const checkConnectivity = async () => {
      if (appStateRef.current === 'active') {
        const online = await isDeviceOnline();
        const wasOffline = !lastOnlineRef.current;

        setConnectivity(online ? 'online' : 'offline');
        lastOnlineRef.current = online;

        // Trigger recovery callback on transition
        if (online && wasOffline && onConnectivityRestored) {
          console.log('[Connectivity] Connectivity restored; triggering recovery callback');
          onConnectivityRestored();
        }
      }
    };

    // Subscribe to app state changes
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Periodic connectivity check every 10 seconds while app is active
    checkInterval = setInterval(checkConnectivity, 10000);

    // Initial check
    checkConnectivity();

    return () => {
      appStateSubscription?.remove();
      clearInterval(checkInterval);
    };
  }, [onConnectivityRestored]);

  return connectivity;
}
