/**
 * Appointments Screen
 * Appointment calendar and management
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Appointment} from '../../types/appointment';
import {
  getAppointmentsByDate,
  getAppointmentsByDateRange,
  deleteAppointment,
} from '../../services/appointment';
import {getPatientById, Patient} from '../../services/patient';
import {useAuthStore} from '../../store/auth.store';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AppointmentsScreen = () => {
  const navigation = useNavigation<any>();
  const {user} = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAppointmentsByDate(selectedDate);
      setAppointments(result);

      // Load patient data for each appointment
      const patientMap: Record<string, Patient> = {};
      for (const appointment of result) {
        try {
          const patient = await getPatientById(appointment.patientId);
          if (patient) {
            patientMap[appointment.patientId] = patient;
          }
        } catch (error) {
          console.error(`Error loading patient ${appointment.patientId}:`, error);
        }
      }
      setPatients(patientMap);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Initial load
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Refresh when screen gains focus (e.g., after adding an appointment)
  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAppointments();
  }, [loadAppointments]);

  // Handle date navigation
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Handle appointment press
  const handleAppointmentPress = useCallback(
    (appointment: Appointment) => {
      navigation.navigate('AppointmentDetail', {appointmentId: appointment.id});
    },
    [navigation],
  );

  // Handle add appointment
  const handleAddAppointment = useCallback(() => {
    navigation.navigate('AddEditAppointment', {mode: 'add'});
  }, [navigation]);

  // Handle delete appointment
  const handleDeleteAppointment = useCallback(
    (appointment: Appointment) => {
      Alert.alert(
        'Delete Appointment',
        `Are you sure you want to delete this appointment?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAppointment(appointment.id);
                Alert.alert('Success', 'Appointment deleted successfully');
                loadAppointments();
              } catch (error) {
                console.error('Error deleting appointment:', error);
                Alert.alert('Error', 'Failed to delete appointment. Please try again.');
              }
            },
          },
        ],
      );
    },
    [loadAppointments],
  );

  // Format date
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#007AFF';
      case 'confirmed':
        return '#34C759';
      case 'completed':
        return '#8E8E93';
      case 'cancelled':
        return '#FF3B30';
      case 'no_show':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render appointment item
  const renderAppointmentItem = ({item}: {item: Appointment}) => {
    const patient = patients[item.patientId];
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : `Patient ID: ${item.patientId.substring(0, 8)}...`;

    return (
      <TouchableOpacity
        onPress={() => handleAppointmentPress(item)}
        activeOpacity={0.7}>
        <Card style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentTime}>
              <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
              <Text style={styles.durationText}>{item.duration} min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
              {item.notes && (
                <Text style={styles.notesText} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}
            </View>
            <View style={styles.appointmentActions}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: getStatusColor(item.status)},
                ]}>
                <Text style={styles.statusText}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteAppointment(item)}
                style={styles.deleteButton}>
                <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading appointments...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="event-busy" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>No appointments</Text>
        <Text style={styles.emptySubtext}>
          No appointments scheduled for {formatDate(selectedDate)}
        </Text>
        <Button
          title="Add Appointment"
          onPress={handleAddAppointment}
          style={styles.addButtonEmpty}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          onPress={handlePreviousDay}
          style={styles.dateButton}>
          <MaterialIcons name="chevron-left" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToday} style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <Text style={styles.dateSubtext}>
            {new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }).format(selectedDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextDay} style={styles.dateButton}>
          <MaterialIcons name="chevron-right" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          appointments.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Button */}
      {appointments.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddAppointment}
            activeOpacity={0.8}>
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dateButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  dateSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  appointmentCard: {
    marginBottom: 12,
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appointmentTime: {
    marginRight: 16,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  appointmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  appointmentActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButtonEmpty: {
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AppointmentsScreen;
