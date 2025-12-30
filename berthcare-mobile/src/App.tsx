/**
 * App Shell - Main Application Container
 *
 * Orchestrates authentication, offline grace period, connectivity monitoring,
 * and automatic token refresh on reconnection.
 *
 * **Architecture Alignment**:
 * - Technical Blueprint Section 5 (Flow 1: App Launch and Schedule Retrieval):
 *   https://github.com/BerthCare/docs#flow-1-app-launch-and-schedule-retrieval
 *   Implements boot flow: restore auth → check offline access → navigate.
 *
 * - Technical Blueprint Section 2 (UX Guardrail 4: "Offline always works"):
 *   https://github.com/BerthCare/docs#the-10-inviolable-ux-guardrails
 *   No hard blocks; soft block only after 7-day grace with dismissible banner.
 *
 * - Technical Blueprint Section 6 (Offline Capability):
 *   https://github.com/BerthCare/docs#offline-capability-it-works-everywhere
 *   Automatic recovery: connectivity detected → token refresh → restore access or route to login.
 *
 * **Key Flows**:
 * 1. Bootstrap: AuthService.configure() → restoreAuthState() → checkOfflineAccess()
 * 2. Offline (within grace): Show app, no banner, allow writes
 * 3. Offline (grace expired): Show banner, enforce read-only
 * 4. Reconnect: Detect connectivity → refreshTokens() → restore or route to Login
 *
 * **Related Documentation**:
 * - `src/lib/auth/README.md` — Offline grace configuration and usage
 * - `src/lib/connectivity.ts` — Connectivity monitoring logic
 * - `src/components/OfflineGraceBanner.tsx` — Soft block UI
 * - `src/lib/offline-access.ts` — Read-only enforcement helpers
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@navigation/RootNavigator';
import OfflineGraceBanner from '@/components/OfflineGraceBanner';
import type { ApiClientInterface, AuthState } from '@/lib/auth';
import { AuthService, secureStorage } from '@/lib/auth';
import { ApiClient, createDefaultConfig } from '@/lib/api';
import { useConnectivityMonitor } from '@/lib/connectivity';
import { createNavigationBreadcrumbHandler } from '@/observability/navigation';
import type { RootStackParamList } from '@/types/navigation';

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isOffline: false,
  requiresReauth: false,
};

const defaultBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? createDefaultConfig().baseUrl;
const DEV_DEVICE_IDS: Record<string, string> = {
  ios: '00000000-0000-4000-8000-000000000001',
  android: '00000000-0000-4000-8000-000000000002',
};

const defaultDeviceId =
  process.env.EXPO_PUBLIC_DEVICE_ID && process.env.EXPO_PUBLIC_DEVICE_ID.trim() !== ''
    ? process.env.EXPO_PUBLIC_DEVICE_ID
    : (DEV_DEVICE_IDS[Platform.OS] ?? '00000000-0000-4000-8000-000000000000');

const createAuthApiAdapter = (baseUrl: string): ApiClientInterface => {
  const client = ApiClient.configure(createDefaultConfig({ baseUrl }));
  return {
    post<T>(url: string, data?: unknown) {
      return client.post<T>(url, data).promise.then((response) => response.data as T);
    },
    setTokenProvider(provider) {
      client.setTokenProvider(provider);
    },
  };
};

export default function App() {
  const [authConfigured, setAuthConfigured] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [offlineAccess, setOfflineAccess] = useState<{
    canContinue: boolean;
    readOnly: boolean;
    reason?: string;
  }>({ canContinue: true, readOnly: false });
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const navigationRef = useMemo(() => createNavigationContainerRef<RootStackParamList>(), []);
  const wasAuthenticatedRef = useRef(false);
  const navigationBreadcrumbs = useMemo(
    () => createNavigationBreadcrumbHandler(() => navigationRef.getCurrentRoute()),
    [navigationRef]
  );

  useEffect(() => {
    const apiAdapter = createAuthApiAdapter(defaultBaseUrl);
    AuthService.configure({
      apiClient: apiAdapter,
      secureStorage,
      deviceId: defaultDeviceId,
      offlineGracePeriodDays: 7,
    });
    setAuthConfigured(true);
  }, []);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }
    // Restore auth state on app start (works in both dev and production)
    const authService = AuthService.getInstance();
    authService
      .restoreAuthState()
      .then(async (state) => {
        setAuthState(state);
        try {
          const result = await authService.checkOfflineAccess();
          setOfflineAccess({ canContinue: result.canContinue, readOnly: !result.canContinue && result.reason === 'OfflineGracePeriodExpired', reason: result.reason });
          if (result.canContinue) {
            setBannerDismissed(false);
          }
        } catch (e) {
          setOfflineAccess({ canContinue: false, readOnly: true, reason: 'NoTokens' });
        }
      })
      .catch((error) => {
        console.warn('Auth restore failed at bootstrap', error);
        setAuthState(authService.getAuthState());
      });
  }, [authConfigured]);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }
    const authService = AuthService.getInstance();
    const unsubscribe = authService.subscribeAuthState((state) => setAuthState(state));
    // Re-evaluate offline access when auth state changes
    const evaluate = async () => {
      try {
        const result = await authService.checkOfflineAccess();
        setOfflineAccess({ canContinue: result.canContinue, readOnly: !result.canContinue && result.reason === 'OfflineGracePeriodExpired', reason: result.reason });
        if (result.canContinue) {
          setBannerDismissed(false);
        }
      } catch (e) {
        setOfflineAccess({ canContinue: false, readOnly: true, reason: 'NoTokens' });
      }
    };
    evaluate();
    return unsubscribe;
  }, [authConfigured]);

  const handleLoginSuccess = useCallback(() => {
    const authService = AuthService.getInstance();
    setAuthState(authService.getAuthState());
  }, []);

  const handleConnectivityRestored = useCallback(async () => {
    if (!authConfigured) {
      return;
    }

    const authService = AuthService.getInstance();
    const currentState = authService.getAuthState();

    // Only attempt refresh if authenticated and offline with expired grace
    if (
      !currentState.isAuthenticated ||
      currentState.requiresReauth ||
      !offlineAccess.readOnly
    ) {
      return;
    }

    console.log('[App] Connectivity restored; attempting token refresh');

    try {
      const result = await authService.refreshTokens();

      if (result.success) {
        console.log('[App] Token refresh succeeded; clearing soft block');
        setAuthState(authService.getAuthState());
        // Re-evaluate offline access which should now show canContinue: true
        const accessResult = await authService.checkOfflineAccess();
        setOfflineAccess({
          canContinue: accessResult.canContinue,
          readOnly: !accessResult.canContinue,
          reason: accessResult.reason,
        });
        setBannerDismissed(false);
      } else {
        console.log('[App] Token refresh failed; routing to Login');
        // Refresh failed; clear auth state and route to login
        await authService.logout();
        setAuthState(authService.getAuthState());
        setOfflineAccess({ canContinue: false, readOnly: false });

        // Reset navigation to Login screen
        if (navigationRef.isReady()) {
          navigationRef.resetRoot({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    } catch (error) {
      console.error('[App] Unexpected error during connectivity recovery', error);
      // Treat as refresh failure; route to login
      await authService.logout();
      setAuthState(authService.getAuthState());
      setOfflineAccess({ canContinue: false, readOnly: false });

      if (navigationRef.isReady()) {
        navigationRef.resetRoot({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [authConfigured, offlineAccess.readOnly, navigationRef]);

  // Monitor connectivity and trigger recovery on reconnect
  useConnectivityMonitor(handleConnectivityRestored);

  useEffect(() => {
    const isAuthenticated = authState.isAuthenticated && !authState.requiresReauth;
    const shouldReset =
      authConfigured && isAuthenticated && !wasAuthenticatedRef.current && navigationRef.isReady();

    if (shouldReset) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Today' }],
      });
    }

    wasAuthenticatedRef.current = isAuthenticated;
  }, [authConfigured, authState.isAuthenticated, authState.requiresReauth, navigationRef]);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={navigationBreadcrumbs.onReady}
        onStateChange={navigationBreadcrumbs.onStateChange}
      >
        {/* Global offline-grace banner (dismissible). Dismissal does NOT re-enable write actions */}
        <OfflineGraceBanner
          visible={
            !bannerDismissed &&
            offlineAccess.reason === 'OfflineGracePeriodExpired' &&
            offlineAccess.canContinue === false
          }
          onDismiss={() => setBannerDismissed(true)}
        />

        <RootNavigator
          authState={authState}
          authConfigured={authConfigured}
          baseUrl={defaultBaseUrl}
          onLoginSuccess={handleLoginSuccess}
          offlineAccess={offlineAccess}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
