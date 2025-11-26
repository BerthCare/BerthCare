import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VisitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visit Documentation</Text>
      <Text style={styles.subtitle}>Screen placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
    marginTop: 8,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
