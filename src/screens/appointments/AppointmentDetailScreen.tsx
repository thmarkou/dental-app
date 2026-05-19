/**
 * Appointment Detail Screen
 * View and manage appointment details
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Appointment} from '../../types/appointment';
import {
  getAppointmentById,
  deleteAppointment,
  checkInAppointment,
  checkOutAppointment,
  cancelAppointment,
  startTreatmentAppointment,
} from '../../services/appointment';
import {getPatientById, Patient} from '../../services/patient';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el, appointmentTypeLabel, appointmentStatusLabel, UI_LOCALE} from '../../i18n';

const AppointmentDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {appointmentId} = route.params;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const appointmentData = await getAppointmentById(appointmentId);
      if (!appointmentData) {
        Alert.alert(el.common.error, el.appointments.notFound, [
          {text: el.common.ok, onPress: () => navigation.goBack()},
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
      Alert.alert(el.common.error, el.appointments.loadAppointmentFailed);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  const handleEdit = () => {
    navigation.navigate('AddEditAppointment', {
      mode: 'edit',
      appointmentId,
    });
  };

  const handleDelete = () => {
    if (!appointment) return;

    Alert.alert(el.appointments.deleteTitle, el.appointments.deleteConfirm, [
      {text: el.common.cancel, style: 'cancel'},
      {
        text: el.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(appointmentId);
            Alert.alert(el.common.success, el.appointments.deleteSuccess, [
              {text: el.common.ok, onPress: () => navigation.goBack()},
            ]);
          } catch (error) {
            console.error('Error deleting appointment:', error);
            Alert.alert(el.common.error, el.appointments.deleteFailed);
          }
        },
      },
    ]);
  };

  const handleCheckIn = async () => {
    if (!appointment) return;

    try {
      setProcessing(true);
      await checkInAppointment(appointmentId);
      Alert.alert(el.common.success, el.appointments.checkInSuccess);
      loadAppointment();
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(el.common.error, el.appointments.checkInFailed);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartTreatment = async () => {
    if (!appointment) return;
    try {
      setProcessing(true);
      await startTreatmentAppointment(appointmentId);
      Alert.alert(el.common.success, el.appointments.treatmentStarted);
      loadAppointment();
    } catch (error) {
      console.error('Error starting treatment:', error);
      Alert.alert(el.common.error, el.appointments.treatmentStartFailed);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!appointment) return;

    try {
      setProcessing(true);
      await checkOutAppointment(appointmentId);
      Alert.alert(el.common.success, el.appointments.checkoutSuccess);
      loadAppointment();
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert(el.common.error, el.appointments.checkoutFailed);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!appointment) return;

    Alert.prompt(
      el.appointments.cancelTitle,
      el.appointments.cancelPrompt,
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.appointments.cancelConfirm,
          onPress: async (reason) => {
            try {
              setProcessing(true);
              await cancelAppointment(appointmentId, reason || undefined);
              Alert.alert(el.common.success, el.appointments.cancelSuccess);
              loadAppointment();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert(el.common.error, el.appointments.cancelFailed);
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
    return new Intl.DateTimeFormat(UI_LOCALE, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(UI_LOCALE, {
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
      case 'checked_in':
        return '#5856D6';
      case 'in_progress':
        return '#FF9500';
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

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{el.appointments.loadingAppointmentDetail}</Text>
        </View>
      </ScreenSafeArea>
    );
  }

  if (!appointment) {
    return (
      <ScreenSafeArea variant="content">
        <View style={styles.loadingContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{el.appointments.notFound}</Text>
          <Button
            title={el.patients.goBack}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
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
              <Text style={styles.durationText}>
                {appointment.duration} {el.common.minutes}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.typeText}>{appointmentTypeLabel(appointment.type)}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: getStatusColor(appointment.status)},
                ]}>
                <Text style={styles.statusText}>
                  {appointmentStatusLabel(appointment.status)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Patient Information */}
        {patient && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{el.appointments.patientInformation}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{el.patients.name}</Text>
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
          <Text style={styles.sectionTitle}>{el.appointments.appointmentDetailsSection}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{el.common.date}</Text>
            <Text style={styles.infoValue}>{formatDate(appointment.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{el.common.time}</Text>
            <Text style={styles.infoValue}>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{el.appointments.duration}</Text>
            <Text style={styles.infoValue}>
              {appointment.duration} {el.appointments.minutesLong}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{el.common.type}</Text>
            <Text style={styles.infoValue}>{appointmentTypeLabel(appointment.type)}</Text>
          </View>

          {appointment.checkInTime && (
            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle" size={20} color="#34C759" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                {el.appointments.checkedInAt}: {formatTime(appointment.checkInTime)}
              </Text>
            </View>
          )}

          {appointment.checkOutTime && (
            <View style={styles.infoRow}>
              <MaterialIcons name="check-circle-outline" size={20} color="#8E8E93" />
              <Text style={[styles.infoValue, styles.contactValue]}>
                {el.appointments.checkedOutAt}: {formatTime(appointment.checkOutTime)}
              </Text>
            </View>
          )}

          {appointment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{el.common.notes}</Text>
              <Text style={styles.infoValue}>{appointment.notes}</Text>
            </View>
          )}

          {appointment.cancellationReason && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{el.appointments.cancellationReason}</Text>
              <Text style={[styles.infoValue, styles.cancellationReason]}>
                {appointment.cancellationReason}
              </Text>
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {(appointment.status === 'scheduled' ||
            appointment.status === 'confirmed') && (
            <Button
              title={el.appointments.checkIn}
              onPress={handleCheckIn}
              variant="primary"
              loading={processing}
              disabled={processing}
              style={styles.actionButton}
            />
          )}

          {appointment.status === 'checked_in' && !appointment.checkOutTime && (
            <Button
              title={el.appointments.startTreatment}
              onPress={handleStartTreatment}
              variant="primary"
              loading={processing}
              disabled={processing}
              style={styles.actionButton}
            />
          )}

          {appointment.status === 'in_progress' && !appointment.checkOutTime && (
            <Button
              title={el.appointments.completeVisit}
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
                title={el.appointments.cancelAppointment}
                onPress={handleCancel}
                variant="danger"
                loading={processing}
                disabled={processing}
                style={styles.actionButton}
              />
            )}

          <Button
            title={el.appointments.editAppointment}
            onPress={handleEdit}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title={el.appointments.deleteAppointment}
            onPress={handleDelete}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
    </ScreenSafeArea>
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

