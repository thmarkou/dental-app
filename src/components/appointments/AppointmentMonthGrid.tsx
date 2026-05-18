/**
 * Month view — calendar grid (Excel-like table).
 */

import React, {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {Appointment} from '../../types/appointment';
import {Patient} from '../../types';
import {startOfLocalDay} from '../../utils/localDate';
import {
  appointmentsOnDay,
  formatTimeShort,
  isSameLocalDay,
  patientLabel,
  statusColor,
} from './appointmentGrid.utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface AppointmentMonthGridProps {
  anchor: Date;
  appointments: Appointment[];
  patients: Record<string, Patient>;
  onPressAppointment: (a: Appointment) => void;
  onPressDay?: (date: Date) => void;
}

export const AppointmentMonthGrid: React.FC<AppointmentMonthGridProps> = ({
  anchor,
  appointments,
  patients,
  onPressAppointment,
  onPressDay,
}) => {
  const monthStart = startOfMonth(startOfLocalDay(anchor));
  const gridStart = startOfWeek(monthStart, {weekStartsOn: 1});
  const gridEnd = endOfWeek(endOfMonth(monthStart), {weekStartsOn: 1});

  const days = useMemo(
    () => eachDayOfInterval({start: gridStart, end: gridEnd}),
    [gridStart.getTime(), gridEnd.getTime()],
  );

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  const today = startOfLocalDay(new Date());

  return (
    <View style={styles.wrap}>
      <Text style={styles.legend}>
        Month plan · tap day for day list · tap appointment to open
      </Text>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <View key={wd} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{wd}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={`w-${wi}`} style={styles.weekRow}>
          {week.map((day) => {
            const inMonth = isSameMonth(day, monthStart);
            const isToday = isSameLocalDay(day, today);
            const dayApts = appointmentsOnDay(appointments, day);
            const visible = dayApts.slice(0, 3);
            const more = dayApts.length - visible.length;

            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => onPressDay?.(startOfLocalDay(day))}
                style={[
                  styles.dayCell,
                  !inMonth && styles.dayCellOutside,
                  isToday && styles.dayCellToday,
                ]}>
                <Text
                  style={[
                    styles.dayNumber,
                    !inMonth && styles.dayNumberOutside,
                    isToday && styles.dayNumberToday,
                  ]}>
                  {format(day, 'd')}
                </Text>
                {visible.map((apt) => (
                  <Pressable
                    key={apt.id}
                    onPress={() => onPressAppointment(apt)}
                    style={[
                      styles.aptLine,
                      {borderLeftColor: statusColor(apt.status)},
                    ]}>
                    <Text style={styles.aptLineText} numberOfLines={1}>
                      {formatTimeShort(apt.startTime)}{' '}
                      {patientLabel(patients, apt.patientId)}
                    </Text>
                  </Pressable>
                ))}
                {more > 0 ? (
                  <Text style={styles.moreText}>+{more} more</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1, padding: 8},
  legend: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekdayRow: {flexDirection: 'row'},
  weekdayCell: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  weekdayText: {fontSize: 11, fontWeight: '700', color: '#475569'},
  weekRow: {flexDirection: 'row', minHeight: 88},
  dayCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 3,
  },
  dayCellOutside: {backgroundColor: '#f8fafc'},
  dayCellToday: {backgroundColor: '#eff6ff'},
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  dayNumberOutside: {color: '#94a3b8'},
  dayNumberToday: {color: '#1d4ed8'},
  aptLine: {
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginBottom: 1,
  },
  aptLineText: {fontSize: 8, color: '#334155'},
  moreText: {fontSize: 8, color: '#64748b', fontStyle: 'italic', marginTop: 1},
});
