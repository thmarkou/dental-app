/**
 * Financial Screen
 * Invoicing and payment management
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const FinancialScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Financial Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 18,
    color: '#666666',
  },
});

export default FinancialScreen;

