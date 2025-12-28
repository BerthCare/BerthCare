import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@navigation/RootNavigator';
import type { ApiClientInterface, AuthState } from '@/lib/auth';
import { AuthService, secureStorage } from '@/lib/auth';
import { ApiClient, createDefaultConfig } from '@/lib/api';
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
      .then((state) => setAuthState(state))
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
    return authService.subscribeAuthState((state) => setAuthState(state));
  }, [authConfigured]);

  const handleLoginSuccess = useCallback(() => {
    const authService = AuthService.getInstance();
    setAuthState(authService.getAuthState());
  }, []);

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
        <RootNavigator
          authState={authState}
          authConfigured={authConfigured}
          baseUrl={defaultBaseUrl}
          onLoginSuccess={handleLoginSuccess}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
