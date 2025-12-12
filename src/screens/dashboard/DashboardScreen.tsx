/**
 * Dashboard Screen
 * Main dashboard showing overview and quick stats
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuthStore} from '../../store/auth.store';

const DashboardScreen = () => {
  const {user} = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Καλώς ήρθατε, {user?.firstName} {user?.lastName}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Σήμερα</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ραντεβού</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Γρήγορη Προβολή</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Ασθενείς</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Ραντεβού</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Θεραπείες</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000000',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000000',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
});

export default DashboardScreen;

