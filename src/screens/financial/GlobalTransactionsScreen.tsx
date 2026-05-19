/**
 * Global cash register view: today's totals by method + recent payments (all patients).
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {isDatabaseAvailable} from '../../services/database';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {
  getDailyTotal,
  getRecentPaymentsWithPatient,
  type DailyTotalByMethod,
  type RecentPaymentWithPatientRow,
} from '../../services/financial/payment.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el, paymentMethodLabel, UI_LOCALE} from '../../i18n';

const eur = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const formatPaymentWhen = (isoOrLocal: string) => {
  try {
    const d = new Date(isoOrLocal);
    if (Number.isNaN(d.getTime())) {
      return isoOrLocal;
    }
    return new Intl.DateTimeFormat(UI_LOCALE, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoOrLocal;
  }
};

function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const GlobalTransactionsScreen: React.FC = () => {
  const {width} = useWindowDimensions();
  const isWide = width >= 840;

  const [selectedDay, setSelectedDay] = useState(todayYmd);
  const [dailyByMethod, setDailyByMethod] = useState<DailyTotalByMethod[]>([]);
  const [recent, setRecent] = useState<RecentPaymentWithPatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!isDatabaseAvailable) {
      setDailyByMethod([]);
      setRecent([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setDailyByMethod(getDailyTotal(selectedDay));
      setRecent(getRecentPaymentsWithPatient(50));
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const dayGrandTotal = useMemo(
    () => dailyByMethod.reduce((s, r) => s + r.total, 0),
    [dailyByMethod],
  );

  const dayTitle = useMemo(() => {
    const [y, m, d] = selectedDay.split('-').map(Number);
    return new Intl.DateTimeFormat(UI_LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  }, [selectedDay]);

  const isToday = selectedDay === todayYmd();

  return (
    <ScreenSafeArea variant="full">
      <ScrollView
        className="flex-1 bg-slate-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: isWide ? 12 : 8,
        }}>
        {!isDatabaseAvailable && <DatabaseWarning />}

        <View className="px-2 py-3">
          <Text className="text-xl font-bold text-slate-900">{el.financial.cashRegister}</Text>
        </View>

        <View className="mb-4 flex-row items-center justify-center gap-4 px-2">
          <Pressable
            onPress={() => setSelectedDay((d) => addDaysYmd(d, -1))}
            className="rounded-full bg-white p-2 shadow-sm active:bg-slate-100"
            accessibilityLabel="Previous day">
            <MaterialIcons name="chevron-left" size={28} color="#2563eb" />
          </Pressable>
          <Text className="min-w-[200px] text-center text-sm font-medium text-slate-700">
            {dayTitle}
            {isToday ? el.financial.todaySuffix : ''}
          </Text>
          <Pressable
            onPress={() => setSelectedDay((d) => addDaysYmd(d, 1))}
            disabled={isToday}
            className={`rounded-full p-2 shadow-sm ${
              isToday ? 'bg-slate-200 opacity-50' : 'bg-white active:bg-slate-100'
            }`}
            accessibilityLabel="Next day">
            <MaterialIcons name="chevron-right" size={28} color="#2563eb" />
          </Pressable>
        </View>

        {loading && isDatabaseAvailable ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-2 text-slate-500">{el.common.loading}</Text>
          </View>
        ) : (
          <>
            <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {el.financial.dailyTotals}
              </Text>
              {dailyByMethod.length === 0 ? (
                <Text className="text-center text-slate-600">
                  {el.financial.noPaymentsDay}
                </Text>
              ) : (
                <>
                  {dailyByMethod.map((row) => (
                    <View
                      key={row.paymentMethod}
                      className="mb-2 flex-row items-center justify-between border-b border-slate-100 pb-2 last:mb-0 last:border-b-0 last:pb-0">
                      <Text className="text-base text-slate-800">
                        {paymentMethodLabel(row.paymentMethod)}
                      </Text>
                      <Text className="text-base font-semibold text-slate-900">
                        {eur(row.total)}
                      </Text>
                    </View>
                  ))}
                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-200 pt-3">
                    <Text className="text-base font-bold text-slate-900">{el.financial.total}</Text>
                    <Text className="text-lg font-bold text-emerald-700">{eur(dayGrandTotal)}</Text>
                  </View>
                </>
              )}
            </View>

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {el.financial.recentPayments}
            </Text>
            {recent.length === 0 ? (
              <Text className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                {el.financial.noPaymentsYet}
              </Text>
            ) : (
              recent.map((p) => (
                <View
                  key={p.paymentId}
                  className="mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                        {p.firstName} {p.lastName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-500">
                        {formatPaymentWhen(p.transactionDate)} ·{' '}
                        {paymentMethodLabel(p.paymentMethod)}
                        {p.receiptIssued ? ` · ${el.financial.receiptTag}` : ''}
                      </Text>
                    </View>
                    <Text className="shrink-0 text-base font-bold text-emerald-700">
                      {eur(p.amount)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default GlobalTransactionsScreen;
