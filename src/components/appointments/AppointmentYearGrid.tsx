/**
 * Year view — 12-month summary table (spreadsheet style).
 */

import React, {useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {eachMonthOfInterval, endOfYear, format, startOfYear} from 'date-fns';
import {Appointment} from '../../types/appointment';
import {formatLocalDateForDb, startOfLocalDay} from '../../utils/localDate';
import {el} from '../../i18n';
import {el as elLocale} from 'date-fns/locale';

export interface AppointmentYearGridProps {
  anchor: Date;
  appointments: Appointment[];
  onPressMonth?: (monthStart: Date) => void;
}

export const AppointmentYearGrid: React.FC<AppointmentYearGridProps> = ({
  anchor,
  appointments,
  onPressMonth,
}) => {
  const yearStart = startOfYear(startOfLocalDay(anchor));
  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: yearStart,
        end: endOfYear(yearStart),
      }),
    [yearStart.getTime()],
  );

  const countByMonth = useMemo(() => {
    const map = new Map<string, number>();
    const daysWithApt = new Map<string, Set<string>>();

    for (const apt of appointments) {
      const d = formatLocalDateForDb(apt.date);
      const monthKey = d.slice(0, 7);
      map.set(monthKey, (map.get(monthKey) ?? 0) + 1);
      if (!daysWithApt.has(monthKey)) {
        daysWithApt.set(monthKey, new Set());
      }
      daysWithApt.get(monthKey)!.add(d);
    }

    return months.map((m) => {
      const key = format(m, 'yyyy-MM');
      return {
        month: m,
        count: map.get(key) ?? 0,
        activeDays: daysWithApt.get(key)?.size ?? 0,
      };
    });
  }, [appointments, months]);

  const yearLabel = format(yearStart, 'yyyy');

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.legend}>
        {el.appointments.yearOverview}
      </Text>
      <Text style={styles.yearHint}>
        {el.appointments.yearTapHint}
      </Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.cellMonth, styles.headerText]}>
            {el.appointments.monthCol}
          </Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>
            {el.appointments.apptsCol}
          </Text>
          <Text style={[styles.cell, styles.cellNum, styles.headerText]}>
            {el.appointments.daysCol}
          </Text>
          <Text style={[styles.cell, styles.cellBar, styles.headerText]}>
            {el.appointments.activityCol}
          </Text>
          <View style={styles.cellChevron} />
        </View>
        {countByMonth.map(({month, count, activeDays}) => {
          const monthKey = format(month, 'yyyy-MM');
          const monthLabel = format(month, 'MMMM', {locale: elLocale});
          const maxDays = 31;
          const barPct = Math.min(100, (activeDays / maxDays) * 100);
          const accessibilityLabel = el.appointments.yearMonthA11y
            .replace('{month}', monthLabel)
            .replace('{count}', String(count));
          return (
            <Pressable
              key={monthKey}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={() => onPressMonth?.(startOfLocalDay(month))}
              style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
              <Text style={[styles.cell, styles.cellMonth, styles.monthName]}>
                {monthLabel}
              </Text>
              <Text style={[styles.cell, styles.cellNum, styles.countText]}>
                {count}
              </Text>
              <Text style={[styles.cell, styles.cellNum, styles.countText]}>
                {activeDays}
              </Text>
              <View style={[styles.cell, styles.cellBar]}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {width: `${Math.max(barPct, count > 0 ? 8 : 0)}%`},
                    ]}
                  />
                </View>
              </View>
              <View style={styles.cellChevron}>
                <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
              </View>
            </Pressable>
          );
        })}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.cell, styles.cellMonth, styles.totalLabel]}>
            {el.appointments.totalYear} {yearLabel}
          </Text>
          <Text style={[styles.cell, styles.cellNum, styles.totalLabel]}>
            {appointments.length}
          </Text>
          <Text style={[styles.cell, styles.cellNum, styles.totalLabel]}>—</Text>
          <View style={styles.cellBar} />
          <View style={styles.cellChevron} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: {flex: 1},
  content: {padding: 12, paddingBottom: 32},
  legend: {fontSize: 12, color: '#64748b', marginBottom: 4},
  yearHint: {fontSize: 11, color: '#94a3b8', marginBottom: 10},
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 52,
  },
  rowPressed: {backgroundColor: '#f1f5f9'},
  headerRow: {backgroundColor: '#f1f5f9', minHeight: 44},
  headerText: {fontSize: 12, fontWeight: '700', color: '#475569'},
  totalRow: {backgroundColor: '#f8fafc', borderBottomWidth: 0},
  cell: {paddingHorizontal: 10, paddingVertical: 12},
  cellMonth: {flex: 2},
  cellNum: {flex: 0.65, textAlign: 'center'},
  cellBar: {flex: 1.35, justifyContent: 'center'},
  cellChevron: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthName: {fontSize: 15, fontWeight: '600', color: '#0f172a'},
  countText: {fontSize: 15, fontWeight: '600', color: '#334155'},
  totalLabel: {fontSize: 13, fontWeight: '700', color: '#1e40af'},
  barTrack: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
});
