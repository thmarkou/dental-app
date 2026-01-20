/**
 * Add/Edit Appointment Screen
 * Form for adding or editing appointments
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Appointment, AppointmentType, AppointmentStatus} from '../../types';
import {
  createAppointment,
  getAppointmentById,
  updateAppointment,
} from '../../services/appointment';
import {getAllPatients, Patient} from '../../services/patient';
import {useAuthStore} from '../../store/auth.store';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const AddEditAppointmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {mode, appointmentId} = route.params;
  const {user} = useAuthStore();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  // Form fields
  const [patientId, setPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<AppointmentType>('regular_checkup');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [notes, setNotes] = useState('');

  // Load patients
  useEffect(() => {
    loadPatients();
  }, []);

  // Load appointment data for edit mode
  useEffect(() => {
    if (mode === 'edit' && appointmentId) {
      loadAppointment();
    } else {
      // Set default date to today
      const today = new Date();
      setDate(today.toISOString().split('T')[0]);
      setStartTime('09:00');
    }
  }, [mode, appointmentId]);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const result = await getAllPatients(100);
      setPatients(result);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const appointment = await getAppointmentById(appointmentId);
      if (!appointment) {
        Alert.alert('Error', 'Appointment not found');
        navigation.goBack();
        return;
      }

      // Find patient
      const patient = patients.find(p => p.id === appointment.patientId);
      if (patient) {
        setSelectedPatient(patient);
      }

      // Populate form fields
      setPatientId(appointment.patientId);
      setDate(appointment.date.toISOString().split('T')[0]);
      setStartTime(
        appointment.startTime.toTimeString().split(' ')[0].substring(0, 5),
      );
      setDuration(appointment.duration.toString());
      setType(appointment.type);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'Failed to load appointment data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patientId = 'Patient is required';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Date cannot be in the past';
      }
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!duration || parseInt(duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setSaving(true);

      // Calculate start and end times
      const [hours, minutes] = startTime.split(':').map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const startTimeDate = new Date(appointmentDate);
      const endTimeDate = new Date(appointmentDate);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + parseInt(duration));

      const appointmentData: Omit<
        Appointment,
        'id' | 'createdAt' | 'updatedAt' | 'reminderSent' | 'reminderSentAt'
      > = {
        patientId,
        date: new Date(date),
        startTime: startTimeDate,
        endTime: endTimeDate,
        duration: parseInt(duration),
        type,
        status,
        doctorId: user.id,
        notes: notes.trim() || undefined,
      };

      if (mode === 'add') {
        await createAppointment(appointmentData, user.id);
        Alert.alert('Success', 'Appointment created successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await updateAppointment(appointmentId, appointmentData);
        Alert.alert('Success', 'Appointment updated successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert(
        'Error',
        `Failed to ${mode === 'add' ? 'create' : 'update'} appointment. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientId(patient.id);
    setShowPatientPicker(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading appointment data...</Text>
      </View>
    );
  }

  const appointmentTypes: AppointmentType[] = [
    'initial_consultation',
    'regular_checkup',
    'cleaning',
    'treatment',
    'follow_up',
    'emergency',
    'consultation',
  ];

  const appointmentStatuses: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>

          {/* Patient Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Patient *</Text>
            <TouchableOpacity
              style={styles.patientSelector}
              onPress={() => setShowPatientPicker(!showPatientPicker)}>
              <Text
                style={[
                  styles.patientSelectorText,
                  !selectedPatient && styles.placeholderText,
                ]}>
                {selectedPatient
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : 'Select Patient'}
              </Text>
              <MaterialIcons
                name={showPatientPicker ? 'expand-less' : 'expand-more'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            {errors.patientId && (
              <Text style={styles.errorText}>{errors.patientId}</Text>
            )}

            {showPatientPicker && (
              <View style={styles.patientPicker}>
                {loadingPatients ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : patients.length === 0 ? (
                  <Text style={styles.emptyText}>No patients found</Text>
                ) : (
                  <ScrollView style={styles.patientList} nestedScrollEnabled>
                    {patients.map(patient => (
                      <TouchableOpacity
                        key={patient.id}
                        style={styles.patientOption}
                        onPress={() => handleSelectPatient(patient)}>
                        <Text style={styles.patientOptionText}>
                          {patient.firstName} {patient.lastName}
                        </Text>
                        {patient.phone && (
                          <Text style={styles.patientOptionPhone}>
                            {patient.phone}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          <Input
            label="Date *"
            value={date}
            onChangeText={setDate}
            error={errors.date}
            placeholder="YYYY-MM-DD"
          />

          <Input
            label="Start Time *"
            value={startTime}
            onChangeText={setStartTime}
            error={errors.startTime}
            placeholder="HH:MM (e.g., 09:00)"
          />

          <Input
            label="Duration (minutes) *"
            value={duration}
            onChangeText={setDuration}
            error={errors.duration}
            placeholder="30"
            keyboardType="numeric"
          />

          {/* Appointment Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              {appointmentTypes.map(typeOption => (
                <TouchableOpacity
                  key={typeOption}
                  style={[
                    styles.typeOption,
                    type === typeOption && styles.typeOptionSelected,
                  ]}
                  onPress={() => setType(typeOption)}>
                  <Text
                    style={[
                      styles.typeOptionText,
                      type === typeOption && styles.typeOptionTextSelected,
                    ]}>
                    {typeOption
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {appointmentStatuses.map(statusOption => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.statusOption,
                    status === statusOption && styles.statusOptionSelected,
                  ]}
                  onPress={() => setStatus(statusOption)}>
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === statusOption &&
                        styles.statusOptionTextSelected,
                    ]}>
                    {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title={mode === 'add' ? 'Create Appointment' : 'Update Appointment'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000',
  },
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 5,
  },
  patientPicker: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    maxHeight: 200,
  },
  patientList: {
    maxHeight: 200,
  },
  patientOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  patientOptionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  patientOptionPhone: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#8E8E93',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
  },
  typeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  typeOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#ffffff',
  },
  statusOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  statusOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AddEditAppointmentScreen;

