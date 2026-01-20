/**
 * Appointment Detail Screen
 * View and manage appointment details
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Appointment} from '../../types/appointment';
import {
  getAppointmentById,
  deleteAppointment,
  checkInAppointment,
  checkOutAppointment,
  cancelAppointment,
} from '../../services/appointment';
import {getPatientById, Patient} from '../../services/patient';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AppointmentDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {appointmentId} = route.params;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const appointmentData = await getAppointmentById(appointmentId);
      if (!appointmentData) {
        Alert.alert('Error', 'Appointment not found', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
        return;
      }
      setAppointment(appointmentData);

      // Load patient data
      try {
        const patientData = await getPatientById(appointmentData.patientId);
        setPatient(patientData);
      } catch (error) {
        console.error('Error loading patient:', error);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddEditAppointment', {
      mode: 'edit',
      appointmentId,
    });
  };

  const handleDelete = () => {
    if (!appointment) return;

    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(appointmentId);
              Alert.alert('Success', 'Appointment deleted successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Failed to delete appointment. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleCheckIn = async () => {
    if (!appointment) return;

    try {
      setProcessing(true);
      await checkInAppointment(appointmentId);
      Alert.alert('Success', 'Patient checked in successfully');
      loadAppointment();
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in patient. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!appointment) return;

    try {
      setProcessing(true);
      await checkOutAppointment(appointmentId);
      Alert.alert('Success', 'Patient checked out successfully');
      loadAppointment();
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert('Error', 'Failed to check out patient. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!appointment) return;

    Alert.prompt(
      'Cancel Appointment',
      'Enter cancellation reason (optional):',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async (reason) => {
            try {
              setProcessing(true);
              await cancelAppointment(appointmentId, reason || undefined);
              Alert.alert('Success', 'Appointment cancelled successfully');
              loadAppointment();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

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

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading appointment data...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Appointment not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(appointment.startTime)}</Text>
              <Text style={styles.durationText}>{appointment.duration} min</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.typeText}>{getTypeLabel(appointment.type)}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: getStatusColor(appointment.status)},
                ]}>
                <Text style={styles.statusText}>
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Patient Information */}
        {patient && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {patient.firstName} {patient.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#007AFF" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                {patient.phone}
              </Text>
            </View>
            {patient.email && (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color="#007AFF" />
                <Text style={[styles.infoValue, styles.contactValue]}>
                  {patient.email}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Appointment Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(appointment.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{appointment.duration} minutes</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{getTypeLabel(appointment.type)}</Text>
          </View>

          {appointment.checkInTime && (
            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle" size={20} color="#34C759" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                Checked in: {formatTime(appointment.checkInTime)}
              </Text>
            </View>
          )}

          {appointment.checkOutTime && (
            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle-outline" size={20} color="#8E8E93" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                Checked out: {formatTime(appointment.checkOutTime)}
              </Text>
            </View>
          )}

          {appointment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{appointment.notes}</Text>
            </View>
          )}

          {appointment.cancellationReason && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cancellation Reason</Text>
              <Text style={[styles.infoValue, styles.cancellationReason]}>
                {appointment.cancellationReason}
              </Text>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {appointment.status === 'scheduled' && !appointment.checkInTime && (
            <Button
              title="Check In"
              onPress={handleCheckIn}
              variant="primary"
              loading={processing}
              disabled={processing}
              style={styles.actionButton}
            />
          )}

          {appointment.status === 'confirmed' &&
            appointment.checkInTime &&
            !appointment.checkOutTime && (
              <Button
                title="Check Out"
                onPress={handleCheckOut}
                variant="primary"
                loading={processing}
                disabled={processing}
                style={styles.actionButton}
              />
            )}

          {appointment.status !== 'cancelled' &&
            appointment.status !== 'completed' && (
              <Button
                title="Cancel Appointment"
                onPress={handleCancel}
                variant="danger"
                loading={processing}
                disabled={processing}
                style={styles.actionButton}
              />
            )}

          <Button
            title="Edit Appointment"
            onPress={handleEdit}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title="Delete Appointment"
            onPress={handleDelete}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
  backButton: {
    marginTop: 24,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    width: 100,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  contactValue: {
    marginLeft: 8,
  },
  cancellationReason: {
    color: '#FF3B30',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default AppointmentDetailScreen;

