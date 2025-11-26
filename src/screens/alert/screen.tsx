import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { palette } from '@ui/palette';

export default function AlertScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Alert</Text>
      <Text style={styles.subtitle}>Screen placeholder</Text>
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
