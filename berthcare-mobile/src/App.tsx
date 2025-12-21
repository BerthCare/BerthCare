import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '@ui/palette';
import type { AuthState } from '@/lib/auth';
import type { TokenProvider } from '@/lib/auth/types';
import { AuthService, secureStorage, STORAGE_KEYS } from '@/lib/auth';
import { ApiClient, createDefaultConfig } from '@/lib/api';
import { triggerTestCrash } from '@/observability/testing';

type TokenSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiry: number | null;
  refreshExpiry: number | null;
};

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isOffline: false,
  requiresReauth: false,
};

const defaultBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? createDefaultConfig().baseUrl;

function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return `${date.toLocaleTimeString()} (${date.toLocaleDateString()})`;
}

function previewToken(token: string | null): string {
  if (!token) return '—';
  const display = token.length > 10 ? `${token.slice(0, 10)}…` : token;
  return `${display} (${token.length} chars)`;
}

function AuthDebugPanel({ baseUrl }: { baseUrl: string }) {
  const [email, setEmail] = useState('caregiver@example.com');
  const [password, setPassword] = useState('password123');
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [tokens, setTokens] = useState<TokenSnapshot>({
    accessToken: null,
    refreshToken: null,
    accessExpiry: null,
    refreshExpiry: null,
  });
  const [status, setStatus] = useState<string>('Idle');
  const [loading, setLoading] = useState<boolean>(false);

  const authService = useMemo(() => AuthService.getInstance(), []);

  const refreshSnapshot = useCallback(async () => {
    const [accessToken, refreshToken, accessExpiryStr, refreshExpiryStr] = await Promise.all([
      secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY),
      secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY),
    ]);

    setTokens({
      accessToken,
      refreshToken,
      accessExpiry: accessExpiryStr ? Number(accessExpiryStr) : null,
      refreshExpiry: refreshExpiryStr ? Number(refreshExpiryStr) : null,
    });
  }, []);

  useEffect(() => {
    const client = ApiClient.configure(createDefaultConfig({ baseUrl }));
    const apiAdapter = {
      post<T>(url: string, data?: unknown) {
        return client.post<T>(url, data).promise.then((response) => response.data as T);
      },
      setTokenProvider(provider: TokenProvider) {
        client.setTokenProvider(provider);
      },
    };
    AuthService.configure({
      apiClient: apiAdapter,
      secureStorage,
      deviceId: `dev-${Platform.OS}-sim`,
      offlineGracePeriodDays: 7,
    });

    authService
      .restoreAuthState()
      .then((state) => {
        setAuthState(state);
        return refreshSnapshot();
      })
      .catch((error) => {
        console.error('Auth restore failed', error);
        setStatus('Auth restore failed');
      });
  }, [authService, baseUrl, refreshSnapshot]);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setStatus('Logging in…');
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setStatus('Login success');
        setAuthState(authService.getAuthState());
        await refreshSnapshot();
      } else {
        setStatus(`Login failed: ${result.error?.type ?? 'Unknown'}`);
      }
    } catch (error) {
      console.error(error);
      setStatus('Login threw an error');
    } finally {
      setLoading(false);
    }
  }, [authService, email, password, refreshSnapshot]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    setStatus('Logging out…');
    try {
      await authService.logout();
      setAuthState(authService.getAuthState());
      await refreshSnapshot();
      setStatus('Logged out and storage cleared');
    } catch (error) {
      console.error(error);
      setStatus('Logout threw an error');
    } finally {
      setLoading(false);
    }
  }, [authService, refreshSnapshot]);

  const handleGetAccessToken = useCallback(async () => {
    setLoading(true);
    setStatus('Fetching access token…');
    try {
      const token = await authService.getAccessToken();
      setAuthState(authService.getAuthState());
      await refreshSnapshot();
      setStatus(token ? `Access token ready (${previewToken(token)})` : 'No token available');
    } catch (error) {
      console.error(error);
      setStatus('Failed to get access token');
    } finally {
      setLoading(false);
    }
  }, [authService, refreshSnapshot]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setStatus('Refreshing access token…');
    try {
      const token = await authService.refreshAccessToken();
      setAuthState(authService.getAuthState());
      await refreshSnapshot();
      setStatus(token ? `Refreshed (${previewToken(token)})` : 'Refresh returned null');
    } catch (error) {
      console.error(error);
      setStatus('Refresh threw an error');
    } finally {
      setLoading(false);
    }
  }, [authService, refreshSnapshot]);

  const forceExpireAccessToken = useCallback(async () => {
    const expired = (Date.now() - 1000).toString();
    await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, expired);
    await refreshSnapshot();
    setStatus('Access token marked expired (next request should refresh)');
  }, [refreshSnapshot]);

  return (
    <View style={styles.authPanel}>
      <Text style={styles.panelTitle}>Auth Debug (dev)</Text>
      <Text style={styles.label}>Base URL</Text>
      <Text style={styles.value}>{baseUrl}</Text>
      <Text style={styles.label}>Auth State</Text>
      <Text style={styles.value}>
        Authenticated: {authState.isAuthenticated ? 'yes' : 'no'} | Offline:{' '}
        {authState.isOffline ? 'yes' : 'no'} | Requires Reauth:{' '}
        {authState.requiresReauth ? 'yes' : 'no'}
      </Text>

      <Text style={styles.label}>Tokens</Text>
      <Text style={styles.value}>Access: {previewToken(tokens.accessToken)}</Text>
      <Text style={styles.value}>Refresh: {previewToken(tokens.refreshToken)}</Text>
      <Text style={styles.value}>Access Expiry: {formatTimestamp(tokens.accessExpiry)}</Text>
      <Text style={styles.value}>Refresh Expiry: {formatTimestamp(tokens.refreshExpiry)}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          style={styles.input}
          value={email}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
          value={password}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button disabled={loading} onPress={handleLogin} title="Login" />
        <Button disabled={loading} onPress={handleLogout} title="Logout" />
      </View>
      <View style={styles.buttonRow}>
        <Button disabled={loading} onPress={handleGetAccessToken} title="Get Access Token" />
        <Button disabled={loading} onPress={handleRefresh} title="Refresh Now" />
      </View>
      <Button disabled={loading} onPress={forceExpireAccessToken} title="Force Expire Access" />

      <Text style={styles.status}>Status: {status}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>BerthCare</Text>
        <Text style={styles.subtitle}>Mobile App Initialized</Text>
        {__DEV__ && (
          <View style={styles.debugBlock}>
            <Text style={styles.debugTitle}>Debug</Text>
            <Button
              title="Trigger test crash"
              onPress={() => {
                Alert.alert('Triggering test crash', 'A test error will be thrown.');
                triggerTestCrash();
              }}
            />
            <AuthDebugPanel baseUrl={defaultBaseUrl} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authPanel: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  buttonRow: {
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  container: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  debugBlock: {
    gap: 16,
    marginTop: 32,
    width: '100%',
  },
  debugTitle: {
    color: palette.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.textPrimary,
    fontSize: 14,
    padding: 10,
    width: '100%',
  },
  inputGroup: {
    marginTop: 12,
    width: '100%',
  },
  label: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  panelTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  status: {
    color: palette.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  value: {
    color: palette.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
});
