/**
 * Home overview — revenue, receivables, today’s schedule.
 */

import React, {useCallback, useState} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuthStore} from '../../store/auth.store';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {isDatabaseAvailable} from '../../services/database';
import {
  currentYearMonthLocal,
  getMonthlyRevenueEur,
  getTotalOutstandingReceivables,
  getAppointmentsCountForDate,
} from '../../services/financial/payment.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el, formatCurrencyEur, UI_LOCALE} from '../../i18n';

function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const OverviewScreen: React.FC = () => {
  const {user} = useAuthStore();
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [todayAppts, setTodayAppts] = useState(0);
  const [monthLabel, setMonthLabel] = useState('');

  const load = useCallback(() => {
    if (!isDatabaseAvailable) {
      return;
    }
    try {
      const ym = currentYearMonthLocal();
      const [yy, mm] = ym.split('-').map(Number);
      setMonthLabel(
        new Intl.DateTimeFormat(UI_LOCALE, {
          month: 'long',
          year: 'numeric',
        }).format(new Date(yy, mm - 1, 1)),
      );
      setMonthRevenue(getMonthlyRevenueEur(ym));
      setPendingTotal(getTotalOutstandingReceivables());
      setTodayAppts(getAppointmentsCountForDate(todayLocalYmd()));
    } catch (e) {
      console.error('Overview load failed:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenSafeArea variant="content">
    <ScrollView className="flex-1 bg-slate-50">
      {!isDatabaseAvailable ? <DatabaseWarning /> : null}
      <View className="p-5 pb-10">
        <Text className="text-2xl font-bold text-slate-900">
          {el.overview.welcome}, {user?.firstName} {user?.lastName}
        </Text>
        <Text className="mt-2 text-sm text-slate-600">
          {el.overview.practiceSummary} — {monthLabel}
        </Text>

        <View className="mt-6 gap-4">
          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-sm font-medium text-slate-500">
              {el.overview.monthRevenue}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-blue-600">
              {formatCurrencyEur(monthRevenue)}
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-sm font-medium text-slate-500">
              {el.overview.outstandingBalances}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-amber-700">
              {formatCurrencyEur(pendingTotal)}
            </Text>
            <Text className="mt-2 text-xs text-slate-500">
              {el.overview.outstandingHint}
            </Text>
          </View>

          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-sm font-medium text-slate-500">
              {el.overview.appointmentsToday}
            </Text>
            <Text className="mt-2 text-3xl font-bold text-emerald-700">
              {todayAppts}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </ScreenSafeArea>
  );
};

export default OverviewScreen;
