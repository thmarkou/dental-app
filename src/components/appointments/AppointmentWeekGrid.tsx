/**
 * Week view — Excel-style time × day grid.
 */

import React, {useMemo} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {Appointment} from '../../types/appointment';
import {Patient} from '../../types';
import {
  getAppointmentViewRange,
  startOfLocalDay,
} from '../../utils/localDate';
import {
  appointmentsInSlot,
  appointmentsOnDay,
  formatTimeShort,
  generateTimeSlotLabels,
  isSameLocalDay,
  patientLabel,
  statusColor,
} from './appointmentGrid.utils';
import {el, UI_LOCALE} from '../../i18n';

const TIME_COL_W = 48;
const DAY_COL_W = 96;
const ROW_H = 52;

export interface AppointmentWeekGridProps {
  anchor: Date;
  appointments: Appointment[];
  patients: Record<string, Patient>;
  onPressAppointment: (a: Appointment) => void;
  onPressDay?: (date: Date) => void;
}

export const AppointmentWeekGrid: React.FC<AppointmentWeekGridProps> = ({
  anchor,
  appointments,
  patients,
  onPressAppointment,
  onPressDay,
}) => {
  const slots = useMemo(() => generateTimeSlotLabels(), []);
  const days = useMemo(() => {
    const {start, end} = getAppointmentViewRange(anchor, 'week');
    const list: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      list.push(startOfLocalDay(d));
      d.setDate(d.getDate() + 1);
    }
    return list;
  }, [anchor]);

  const today = startOfLocalDay(new Date());

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent}>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{el.appointments.weekPlanLegend}</Text>
      </View>
      <View style={styles.table}>
        <View style={[styles.timeCol, {width: TIME_COL_W}]}>
          <View style={[styles.corner, {height: 44}]} />
          {slots.map((label) => (
            <View key={label} style={[styles.timeCell, {height: ROW_H}]}>
              <Text style={styles.timeText}>{label}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.headerRow}>
              {days.map((day) => {
                const isToday = isSameLocalDay(day, today);
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => onPressDay?.(day)}
                    style={[
                      styles.dayHeader,
                      {width: DAY_COL_W},
                      isToday && styles.dayHeaderToday,
                    ]}>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                      {new Intl.DateTimeFormat(UI_LOCALE, {weekday: 'short'}).format(day)}
                    </Text>
                    <Text style={[styles.dayNum, isToday && styles.dayNameToday]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {slots.map((slotLabel, slotIdx) => (
              <View key={slotLabel} style={styles.dataRow}>
                {days.map((day) => {
                  const dayApts = appointmentsOnDay(appointments, day);
                  const inSlot = appointmentsInSlot(dayApts, slotIdx);
                  const isToday = isSameLocalDay(day, today);
                  return (
                    <View
                      key={`${day.toISOString()}-${slotLabel}`}
                      style={[
                        styles.gridCell,
                        {width: DAY_COL_W, minHeight: ROW_H},
                        isToday && styles.gridCellToday,
                      ]}>
                      {inSlot.map((apt) => (
                        <Pressable
                          key={apt.id}
                          onPress={() => onPressAppointment(apt)}
                          style={[
                            styles.aptBlock,
                            {
                              borderLeftColor: statusColor(apt.status),
                              minHeight: Math.max(
                                28,
                                (apt.duration / 30) * (ROW_H * 0.45),
                              ),
                            },
                          ]}>
                          <Text style={styles.aptTime} numberOfLines={1}>
                            {formatTimeShort(apt.startTime)}
                          </Text>
                          <Text style={styles.aptName} numberOfLines={2}>
                            {patientLabel(patients, apt.patientId)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1},
  scrollContent: {paddingBottom: 24},
  legend: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  legendText: {fontSize: 11, color: '#64748b'},
  table: {flex: 1, flexDirection: 'row'},
  timeCol: {backgroundColor: '#f1f5f9', borderRightWidth: 1, borderColor: '#cbd5e1'},
  corner: {borderBottomWidth: 1, borderColor: '#cbd5e1'},
  timeCell: {
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  timeText: {fontSize: 10, color: '#64748b', fontWeight: '500'},
  headerRow: {flexDirection: 'row', backgroundColor: '#f1f5f9'},
  dayHeader: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
  },
  dayHeaderToday: {backgroundColor: '#dbeafe'},
  dayName: {fontSize: 11, fontWeight: '600', color: '#475569'},
  dayNum: {fontSize: 15, fontWeight: '700', color: '#0f172a'},
  dayNameToday: {color: '#1d4ed8'},
  dataRow: {flexDirection: 'row'},
  gridCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 2,
  },
  gridCellToday: {backgroundColor: '#f8fafc'},
  aptBlock: {
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 2,
  },
  aptTime: {fontSize: 9, fontWeight: '700', color: '#1e40af'},
  aptName: {fontSize: 9, color: '#334155'},
});
