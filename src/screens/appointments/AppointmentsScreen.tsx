/**
 * Appointments Screen
 * Appointment calendar and management
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const AppointmentsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Appointments Screen - Coming Soon</Text>
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

export default AppointmentsScreen;

