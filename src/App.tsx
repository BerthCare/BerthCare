import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>BerthCare</Text>
        <Text style={styles.subtitle}>Mobile App Initialized</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    alignItems: 'center',
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
    fontSize: 32,
    fontWeight: 'bold',
  },
});
