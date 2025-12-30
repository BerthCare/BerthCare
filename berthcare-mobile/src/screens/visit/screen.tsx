import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { canPerformWrites, getReadOnlyMessage } from '@/lib/offline-access';
import { palette } from '@ui/palette';

type VisitScreenProps = {
  authState?: import('@/lib/auth').AuthState;
  offlineAccess?: { canContinue: boolean; readOnly: boolean; reason?: string };
};

export default function VisitScreen(_props: VisitScreenProps) {
  const writesAllowed = canPerformWrites(_props.offlineAccess);
  const readOnlyMessage = getReadOnlyMessage(_props.offlineAccess);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visit Documentation</Text>
      <Text style={styles.subtitle}>Screen placeholder</Text>
      {readOnlyMessage && (
        <View style={styles.readOnlyWarning}>
          <Text style={styles.readOnlyWarningText}>{readOnlyMessage}</Text>
        </View>
      )}
      {!writesAllowed && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>Read-only mode: Edits are disabled</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
  },
  disabledOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
  disabledText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
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
    fontSize: 24,
    fontWeight: 'bold',
  },
});
