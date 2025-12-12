/**
 * Treatments Screen
 * Treatment management and recording
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const TreatmentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Treatments Screen - Coming Soon</Text>
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

export default TreatmentsScreen;

