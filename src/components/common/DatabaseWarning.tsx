/**
 * Database Warning Component
 * Shows a warning when database is not available (Expo Go limitation)
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const DatabaseWarning: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ Development Build Required</Text>
      <Text style={styles.message}>
        Database features require a development build.{'\n'}
        To enable full functionality:{'\n\n'}
        1. Run: npx expo prebuild{'\n'}
        2. Then: npx expo run:ios{'\n\n'}
        The app UI is available for preview.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

