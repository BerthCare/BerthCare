import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
});
