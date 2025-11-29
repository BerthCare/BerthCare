import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, Button, Alert } from 'react-native';

import { palette } from '@ui/palette';
import { triggerTestCrash } from '@/observability/testing';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
          </View>
        )}
      </View>
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
  },
  debugBlock: {
    marginTop: 32,
    width: '80%',
  },
  debugTitle: {
    color: palette.textSecondary,
    fontSize: 14,
    marginBottom: 8,
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
