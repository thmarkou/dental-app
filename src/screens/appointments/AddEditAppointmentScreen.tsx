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
import {getAllPatients, getPatientById, Patient} from '../../services/patient';
import {useAuthStore} from '../../store/auth.store';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {DatePickerField} from '../../components/common/DatePickerField';
import {TimePickerField} from '../../components/common/TimePickerField';
import {
  formatReminderChannelsLabel,
  getPracticeReminderSettings,
} from '../../services/appointment/reminderScheduler.service';
import {el, appointmentTypeLabel, appointmentStatusLabel} from '../../i18n';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function defaultStartTime(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

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
  const [appointmentDate, setAppointmentDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [startTimeAt, setStartTimeAt] = useState(defaultStartTime);
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<AppointmentType>('regular_checkup');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    void (async () => {
      const patientList = await loadPatients();
      if (mode === 'edit' && appointmentId) {
        await loadAppointment(patientList);
      } else {
        setAppointmentDate(startOfDay(new Date()));
        setStartTimeAt(defaultStartTime());
      }
    })();
  }, [mode, appointmentId]);

  const loadPatients = async (): Promise<Patient[]> => {
    try {
      setLoadingPatients(true);
      const result = await getAllPatients(100);
      setPatients(result);
      return result;
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert(el.common.error, el.appointments.loadPatientsFailed);
      return [];
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadAppointment = async (patientList: Patient[]) => {
    try {
      setLoading(true);
      const appointment = await getAppointmentById(appointmentId);
      if (!appointment) {
        Alert.alert(el.common.error, el.appointments.notFound);
        navigation.goBack();
        return;
      }

      const patient =
        patientList.find((p) => p.id === appointment.patientId) ??
        (await getPatientById(appointment.patientId));
      if (patient) {
        setSelectedPatient(patient);
      }

      setPatientId(appointment.patientId);
      setAppointmentDate(startOfDay(appointment.date));
      setStartTimeAt(new Date(appointment.startTime));
      setDuration(appointment.duration.toString());
      setType(appointment.type);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert(el.common.error, el.appointments.loadAppointmentFailed);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patientId = el.appointments.patientRequired;
    }

    if (mode === 'add') {
      const sel = startOfDay(appointmentDate);
      const today = startOfDay(new Date());
      if (sel < today) {
        newErrors.date = el.appointments.datePast;
      }
    }

    if (!Number.isFinite(startTimeAt.getTime())) {
      newErrors.startTime = el.appointments.startTimeRequired;
    }

    if (!duration || parseInt(duration) <= 0) {
      newErrors.duration = el.appointments.durationInvalid;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(el.appointments.validationErrorTitle, el.appointments.validationError);
      return;
    }

    if (!user) {
      Alert.alert(el.common.error, el.appointments.userNotFound);
      return;
    }

    try {
      setSaving(true);

      // Calculate start and end times
      const dayBase = startOfDay(appointmentDate);
      dayBase.setHours(startTimeAt.getHours(), startTimeAt.getMinutes(), 0, 0);

      const startTimeDate = new Date(dayBase);
      const endTimeDate = new Date(dayBase);
      endTimeDate.setMinutes(endTimeDate.getMinutes() + parseInt(duration, 10));

      const appointmentData: Omit<
        Appointment,
        'id' | 'createdAt' | 'updatedAt' | 'reminderSent' | 'reminderSentAt'
      > = {
        patientId,
        date: startOfDay(appointmentDate),
        startTime: startTimeDate,
        endTime: endTimeDate,
        duration: parseInt(duration, 10),
        type,
        status,
        doctorId: user.id,
        notes: notes.trim() || undefined,
        createdBy: user.id,
      };

      if (mode === 'add') {
        await createAppointment(appointmentData, user.id);
        Alert.alert(el.common.success, el.appointments.createSuccess, [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        const {createdBy: _createdBy, ...appointmentUpdate} = appointmentData;
        await updateAppointment(appointmentId, appointmentUpdate);
        Alert.alert(el.common.success, el.appointments.updateSuccess, [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert(el.common.error, el.appointments.saveFailed);
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
      <ScreenSafeArea variant="content">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{el.appointments.formLoading}</Text>
        </View>
      </ScreenSafeArea>
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

  const resolvedPatient =
    selectedPatient ?? patients.find((p) => p.id === patientId) ?? null;

  const appointmentStatuses: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'checked_in',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ];

  return (
    <ScreenSafeArea variant="content">
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{el.appointments.appointmentInfo}</Text>

          {/* Patient Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{el.common.patient} *</Text>
            <TouchableOpacity
              style={styles.patientSelector}
              onPress={() => setShowPatientPicker(!showPatientPicker)}>
              <Text
                style={[
                  styles.patientSelectorText,
                  !resolvedPatient && styles.placeholderText,
                ]}>
                {resolvedPatient
                  ? `${resolvedPatient.firstName} ${resolvedPatient.lastName}`
                  : el.appointments.selectPatient}
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
                  <Text style={styles.emptyText}>{el.patients.noPatients}</Text>
                ) : (
                  <ScrollView style={styles.patientList} nestedScrollEnabled>
                    {patients.map(patient => (
                      <TouchableOpacity
                        key={patient.id}
                        style={[
                          styles.patientOption,
                          patient.id === patientId && styles.patientOptionSelected,
                        ]}
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

          <DatePickerField
            label={`${el.common.date} *`}
            value={appointmentDate}
            onChange={(d) => setAppointmentDate(startOfDay(d))}
            error={errors.date}
            minimumDate={mode === 'add' ? startOfDay(new Date()) : undefined}
          />

          <TimePickerField
            label={`${el.appointments.startTime} *`}
            value={startTimeAt}
            onChange={setStartTimeAt}
            error={errors.startTime}
          />

          <Input
            label={`${el.appointments.duration} *`}
            value={duration}
            onChangeText={setDuration}
            error={errors.duration}
            placeholder="30"
            keyboardType="numeric"
          />

          {/* Appointment Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{el.common.type}</Text>
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
                    {appointmentTypeLabel(typeOption)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{el.common.status}</Text>
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
                    {appointmentStatusLabel(statusOption)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label={el.common.notes}
            value={notes}
            onChangeText={setNotes}
            placeholder={el.appointments.notesPlaceholder}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Card>

        {(() => {
          const rs = getPracticeReminderSettings();
          if (!rs.enabled) {
            return null;
          }
          return (
            <Text style={styles.reminderHint}>
              {el.appointments.reminderPreview
                .replace('{hours}', String(rs.hoursBefore))
                .replace('{channels}', formatReminderChannelsLabel(rs.channels))}
            </Text>
          );
        })()}

        <View style={styles.buttonContainer}>
          <Button
            title={mode === 'add' ? el.appointments.create : el.appointments.update}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  patientOptionSelected: {
    backgroundColor: '#E3F2FD',
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
  reminderHint: {
    fontSize: 13,
    color: '#64748b',
    marginHorizontal: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default AddEditAppointmentScreen;

