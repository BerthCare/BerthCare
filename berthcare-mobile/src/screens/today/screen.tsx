import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthDebugPanel } from '@/components/AuthDebugPanel';
import { canPerformWrites, getReadOnlyMessage } from '@/lib/offline-access';
import type { AuthState } from '@/lib/auth';
import { triggerTestCrash } from '@/observability/testing';
import type { RootStackScreenProps } from '@/types/navigation';
import { palette } from '@ui/palette';

type TodayScreenProps = RootStackScreenProps<'Today'> & {
  authState: AuthState;
  authConfigured: boolean;
  baseUrl: string;
  offlineAccess?: { canContinue: boolean; readOnly: boolean; reason?: string };
};

export default function TodayScreen({ authState, authConfigured, baseUrl, offlineAccess }: TodayScreenProps) {
  const writesAllowed = canPerformWrites(offlineAccess);
  const readOnlyMessage = getReadOnlyMessage(offlineAccess);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>BerthCare</Text>
        <Text style={styles.subtitle} testID="auth-status-subtitle">
          {authState.isAuthenticated && !authState.requiresReauth
            ? 'Authenticated'
            : authState.requiresReauth
              ? 'Session expired - please log in'
              : 'Signed out'}
        </Text>
        {readOnlyMessage && (
          <View style={styles.readOnlyWarning}>
            <Text style={styles.readOnlyWarningText}>{readOnlyMessage}</Text>
          </View>
        )}
        {__DEV__ && (
          <View style={styles.debugBlock}>
            <Text style={styles.debugTitle}>Debug</Text>
            <Button
              title="Trigger test crash"
              onPress={() => {
                Alert.alert('Triggering test crash', 'A test error will be thrown.');
                triggerTestCrash();
              }}
              disabled={!writesAllowed}
            />
            <AuthDebugPanel
              baseUrl={baseUrl}
              isAuthConfigured={authConfigured}
              initialAuthState={authState}
              disabled={!writesAllowed}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  readOnlyWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    padding: 12,
  },
  readOnlyWarningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
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
});
