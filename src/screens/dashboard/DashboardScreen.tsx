/**
 * Dashboard Screen
 * Main dashboard showing overview and quick stats
 */

import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuthStore} from '../../store/auth.store';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {isDatabaseAvailable, query} from '../../services/database';

const DashboardScreen = () => {
  const {user} = useAuthStore();
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    treatments: 0,
    todayAppointments: 0,
  });

  const loadStats = useCallback(async () => {
    if (!isDatabaseAvailable) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const patientsResult = await query('SELECT COUNT(*) as count FROM patients');
      const appointmentsResult = await query(
        'SELECT COUNT(*) as count FROM appointments',
      );
      const todayAppointmentsResult = await query(
        'SELECT COUNT(*) as count FROM appointments WHERE date = ?',
        [today],
      );

      const getCount = (rows: any[]) => Number(rows?.[0]?.count ?? 0);

      setStats({
        patients: getCount(patientsResult),
        appointments: getCount(appointmentsResult),
        treatments: 0, // Treatments table not implemented yet
        todayAppointments: getCount(todayAppointmentsResult),
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }, []);

  // Refresh stats when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <ScrollView style={styles.container}>
      {!isDatabaseAvailable && <DatabaseWarning />}
      <View style={styles.content}>
        <Text style={styles.welcome}>
          Welcome, {user?.firstName} {user?.lastName}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Appointments</Text>
            <Text style={styles.cardValue}>{stats.todayAppointments}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.patients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.appointments}</Text>
              <Text style={styles.statLabel}>Appointments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.treatments}</Text>
              <Text style={styles.statLabel}>Treatments</Text>
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

