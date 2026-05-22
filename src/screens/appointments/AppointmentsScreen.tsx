/**
 * Appointments Screen
 * Appointment calendar and management
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {Appointment} from '../../types/appointment';
import {
  deleteAppointment,
  getAppointmentsByDateRange,
} from '../../services/appointment';
import {getPracticeSettings} from '../../services/settings/practiceSettings.service';
import type {PatientNameMode} from '../../components/appointments/appointmentGrid.utils';
import {getPatientById, Patient} from '../../services/patient';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {AppointmentWeekGrid} from '../../components/appointments/AppointmentWeekGrid';
import {AppointmentMonthGrid} from '../../components/appointments/AppointmentMonthGrid';
import {AppointmentYearGrid} from '../../components/appointments/AppointmentYearGrid';
import {
  type AppointmentCalendarView,
  formatAppointmentViewPeriod,
  formatLocalDateForDb,
  getAppointmentViewRange,
  parseLocalDateFromDb,
  shiftAppointmentAnchor,
  startOfLocalDay,
} from '../../utils/localDate';
import {
  el,
  appointmentStatusLabel,
  appointmentTypeLabel,
  appointmentCountEl,
  UI_LOCALE,
} from '../../i18n';

const VIEW_MODES: {id: AppointmentCalendarView; label: string}[] = [
  {id: 'day', label: el.appointments.viewDay},
  {id: 'week', label: el.appointments.viewWeek},
  {id: 'month', label: el.appointments.viewMonth},
  {id: 'year', label: el.appointments.viewYear},
];

const AppointmentsScreen = () => {
  const navigation = useNavigation<any>();
  const {width: layoutWidth} = useWindowDimensions();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));
  const [viewMode, setViewMode] = useState<AppointmentCalendarView>('day');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerDraft, setDatePickerDraft] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [gridNameMode, setGridNameMode] = useState<PatientNameMode>('full');

  const openDatePicker = () => {
    setDatePickerDraft(startOfLocalDay(selectedDate));
    setDatePickerOpen(true);
  };

  const onAndroidDateChange = (event: DateTimePickerEvent, d?: Date) => {
    setDatePickerOpen(false);
    if (event.type === 'set' && d) {
      setSelectedDate(startOfLocalDay(d));
    }
  };

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const {start, end} = getAppointmentViewRange(selectedDate, viewMode);
      const result = await getAppointmentsByDateRange(start, end);
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
      Alert.alert(el.common.error, el.appointments.loadFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, viewMode]);

  useFocusEffect(
    useCallback(() => {
      setGridNameMode(getPracticeSettings().appointmentGridNameMode);
    }, []),
  );

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

  const handlePreviousPeriod = () => {
    setSelectedDate((d) => shiftAppointmentAnchor(d, viewMode, -1));
  };

  const handleNextPeriod = () => {
    setSelectedDate((d) => shiftAppointmentAnchor(d, viewMode, 1));
  };

  const handleToday = () => {
    setSelectedDate(startOfLocalDay(new Date()));
  };

  const formatSectionDate = useCallback((date: Date) => {
    const today = startOfLocalDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return el.common.today;
    }
    if (date.getTime() === tomorrow.getTime()) {
      return el.common.tomorrow;
    }
    if (date.getTime() === yesterday.getTime()) {
      return el.common.yesterday;
    }
    return new Intl.DateTimeFormat(UI_LOCALE, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }, []);

  const sections = useMemo(() => {
    if (appointments.length === 0) {
      return [];
    }
    const byDate = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const key = formatLocalDateForDb(apt.date);
      const list = byDate.get(key) ?? [];
      list.push(apt);
      byDate.set(key, list);
    }
    return Array.from(byDate.entries()).map(([key, data]) => ({
      title: formatSectionDate(parseLocalDateFromDb(key)),
      data,
    }));
  }, [appointments, formatSectionDate]);

  const periodLabel = formatAppointmentViewPeriod(selectedDate, viewMode);

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

  const handlePressDayFromGrid = useCallback((date: Date) => {
    setSelectedDate(startOfLocalDay(date));
    setViewMode('day');
  }, []);

  const handlePressMonthFromGrid = useCallback((monthStart: Date) => {
    setSelectedDate(startOfLocalDay(monthStart));
    setViewMode('month');
  }, []);

  // Handle delete appointment
  const handleDeleteAppointment = useCallback(
    (appointment: Appointment) => {
      Alert.alert(el.appointments.deleteTitle, el.appointments.deleteConfirm, [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(appointment.id);
              Alert.alert(el.common.success, el.appointments.deleteSuccess);
              loadAppointments();
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert(el.common.error, el.appointments.deleteFailed);
            }
          },
        },
      ]);
    },
    [loadAppointments],
  );

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return el.common.today;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return el.common.tomorrow;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return el.common.yesterday;
    } else {
      return new Intl.DateTimeFormat(UI_LOCALE, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(UI_LOCALE, {
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

  // Render appointment item
  const renderAppointmentItem = ({item}: {item: Appointment}) => {
    const patient = patients[item.patientId];
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : `${el.appointments.patientIdFallback} #${item.patientId.substring(0, 8)}`;

    return (
      <TouchableOpacity
        onPress={() => handleAppointmentPress(item)}
        activeOpacity={0.7}>
        <Card style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentTime}>
              <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
              <Text style={styles.durationText}>
                {item.duration} {el.common.minutes}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.typeText}>{appointmentTypeLabel(item.type)}</Text>
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
                  {appointmentStatusLabel(item.status)}
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
          <Text style={styles.emptyText}>{el.appointments.loadingAppointments}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="event-busy" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>{el.appointments.noAppointments}</Text>
        <Text style={styles.emptySubtext}>
          {viewMode === 'day'
            ? `${el.appointments.noAppointmentsDay} ${formatDate(selectedDate)}`
            : `${el.appointments.noAppointmentsPeriod} · ${periodLabel}`}
        </Text>
        <Button
          title={el.appointments.addAppointment}
          onPress={handleAddAppointment}
          style={styles.addButtonEmpty}
        />
      </View>
    );
  };

  return (
    <ScreenSafeArea variant="content">
    <View style={styles.container}>
      <View style={styles.viewModeRow}>
        {VIEW_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => setViewMode(mode.id)}
            style={[
              styles.viewModeChip,
              viewMode === mode.id && styles.viewModeChipActive,
            ]}>
            <Text
              style={[
                styles.viewModeChipText,
                viewMode === mode.id && styles.viewModeChipTextActive,
              ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={handlePreviousPeriod} style={styles.dateButton}>
          <MaterialIcons name="chevron-left" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.dateCenterWrap}>
          <TouchableOpacity onPress={openDatePicker} style={styles.dateDisplay}>
            <Text style={styles.dateText}>
              {viewMode === 'day' ? formatDate(selectedDate) : periodLabel}
            </Text>
            <Text style={styles.dateSubtext}>
              {viewMode === 'day'
                ? new Intl.DateTimeFormat(UI_LOCALE, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(selectedDate)
                : appointmentCountEl(appointments.length)}
            </Text>
            <Text style={styles.dateTapHint}>
              {viewMode === 'day'
                ? el.appointments.tapChangeDate
                : el.appointments.tapJumpDate}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToday} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>{el.common.today}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleNextPeriod} style={styles.dateButton}>
          <MaterialIcons name="chevron-right" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {viewMode === 'day' ? (
        <SectionList
          sections={sections}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            appointments.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : appointments.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.gridScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {viewMode === 'week' ? (
            <AppointmentWeekGrid
              anchor={selectedDate}
              appointments={appointments}
              patients={patients}
              layoutWidth={layoutWidth}
              patientNameMode={gridNameMode}
              onPressAppointment={handleAppointmentPress}
              onPressDay={handlePressDayFromGrid}
            />
          ) : null}
          {viewMode === 'month' ? (
            <AppointmentMonthGrid
              anchor={selectedDate}
              appointments={appointments}
              patients={patients}
              layoutWidth={layoutWidth}
              patientNameMode={gridNameMode}
              onPressAppointment={handleAppointmentPress}
              onPressDay={handlePressDayFromGrid}
            />
          ) : null}
          {viewMode === 'year' ? (
            <AppointmentYearGrid
              anchor={selectedDate}
              appointments={appointments}
              onPressMonth={handlePressMonthFromGrid}
            />
          ) : null}
        </ScrollView>
      )}

      {/* Add Button */}
      {appointments.length > 0 && viewMode === 'day' && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddAppointment}
            activeOpacity={0.8}>
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === 'android' && datePickerOpen && (
        <DateTimePicker
          value={datePickerDraft}
          mode="date"
          display="default"
          onChange={onAndroidDateChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={datePickerOpen} transparent animationType="slide">
          <Pressable style={styles.modalBackdrop} onPress={() => setDatePickerOpen(false)}>
            <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setDatePickerOpen(false)}>
                  <Text style={styles.pickerHeaderBtn}>{el.common.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(startOfLocalDay(datePickerDraft));
                    setDatePickerOpen(false);
                  }}>
                  <Text style={[styles.pickerHeaderBtn, styles.pickerHeaderBtnPrimary]}>
                    {el.common.done}
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={datePickerDraft}
                mode="date"
                display="spinner"
                themeVariant="light"
                onChange={(_, d) => {
                  if (d) {
                    setDatePickerDraft(d);
                  }
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
    </ScreenSafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  viewModeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  viewModeChipActive: {
    backgroundColor: '#007AFF',
  },
  viewModeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  viewModeChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#F5F5F5',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  dateCenterWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateTapHint: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 4,
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  pickerHeaderBtn: {
    fontSize: 17,
    color: '#007AFF',
  },
  pickerHeaderBtnPrimary: {
    fontWeight: '600',
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
  gridScroll: {
    flex: 1,
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
