/**
 * Offline Grace Banner Component
 *
 * Displays a dismissible banner when the offline grace period has expired,
 * informing users that they need to reconnect to continue making changes.
 * This implements the "soft block" UX pattern per Technical Blueprint guardrails.
 *
 * **Architecture Alignment**:
 * - Technical Blueprint Section 2 (UX Guardrail 4: "Offline always works"):
 *   https://github.com/BerthCare/docs#the-10-inviolable-ux-guardrails
 *   Implements "clarity without friction": dismissible message, no hard blocks.
 *
 * - Design Pattern: Non-modal, in-flow dismissible alert (per Design System).
 *   Allows users to continue viewing cached data read-only after dismissal.
 *
 * **Important Behavior**:
 * - Dismissal DOES NOT re-enable write actions
 * - Read-only enforcement is independent of banner visibility
 * - Used as global banner in App.tsx shell (not per-screen)
 *
 * **Related Code**:
 * - `src/App.tsx` — Integrates banner with global offline access state
 * - `src/lib/offline-access.ts` — Provides read-only enforcement helpers
 * - `src/lib/connectivity.ts` — Triggers banner when grace expires during offline
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityRole } from 'react-native';

type Props = {
  visible: boolean;
  message?: string;
  onDismiss: () => void;
  accessibilityLabel?: string;
};

export default function OfflineGraceBanner({
  visible,
  message = 'Connect to internet to continue',
  onDismiss,
  accessibilityLabel = 'offline-grace-banner',
}: Props) {
  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityRole={'alert' as AccessibilityRole} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}-dismiss`}
        onPress={onDismiss}
        style={styles.dismissButton}
      >
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    color: '#856404',
    flex: 1,
    marginRight: 12,
  },
  dismissButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  dismissText: {
    color: '#007AFF',
  },
});
