/**
 * Management reports (Module K) — monthly KPIs and receivables.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {isDatabaseAvailable} from '../../services/database';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {
  getMonthSummary,
  getOutstandingDebts,
  type MonthSummary,
  type OutstandingDebtRow,
} from '../../services/admin/report.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

const eur = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'}).format(
    new Date(y, m - 1, 1),
  );

const KpiCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  accent: string;
  minWidth: number;
}> = ({title, value, icon, accent, minWidth}) => (
  <View
    className="mb-3 flex-grow rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    style={{minWidth, flexBasis: minWidth}}>
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </Text>
      <MaterialIcons name={icon} size={22} color={accent} />
    </View>
    <Text className="text-2xl font-bold text-slate-900">{value}</Text>
  </View>
);

const ReportsScreen: React.FC = () => {
  const {width} = useWindowDimensions();
  const isWide = width >= 840;
  const cardMinW = width >= 900 ? width * 0.28 : width * 0.42;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [debts, setDebts] = useState<OutstandingDebtRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      setSummary(null);
      setDebts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        getMonthSummary(month, year),
        getOutstandingDebts(15),
      ]);
      setSummary(s);
      setDebts(d);
    } catch (e) {
      console.error(e);
      setSummary(null);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  return (
    <ScreenSafeArea variant="full">
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{
          paddingBottom: 32,
          paddingHorizontal: isWide ? 12 : 8,
        }}>
        {!isDatabaseAvailable && <DatabaseWarning />}

        <View className="px-2 py-3">
          <Text className="text-2xl font-bold text-slate-900">Reports</Text>
          <Text className="mt-1 text-sm text-slate-600">
            Monthly performance and accounts receivable
          </Text>
        </View>

        <View className="mb-6 flex-row items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
          <Pressable
            accessibilityRole="button"
            onPress={() => shiftMonth(-1)}
            className="rounded-lg p-2 active:bg-slate-100">
            <MaterialIcons name="chevron-left" size={28} color="#334155" />
          </Pressable>
          <Text className="text-base font-semibold text-slate-800">
            {monthLabel(year, month)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => shiftMonth(1)}
            className="rounded-lg p-2 active:bg-slate-100">
            <MaterialIcons name="chevron-right" size={28} color="#334155" />
          </Pressable>
        </View>

        {loading ? (
          <View className="py-12">
            <ActivityIndicator size="large" color="#0f172a" />
          </View>
        ) : summary ? (
          <>
            <View className="mb-2 flex-row flex-wrap justify-between gap-3">
              <KpiCard
                title="Revenue"
                value={eur(summary.revenue)}
                icon="payments"
                accent="#059669"
                minWidth={cardMinW}
              />
              <KpiCard
                title="New patients"
                value={String(summary.newPatients)}
                icon="person-add"
                accent="#2563eb"
                minWidth={cardMinW}
              />
            </View>

            <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Clinical procedures
              </Text>
              {summary.procedures.length === 0 ? (
                <Text className="text-sm text-slate-400">No procedures this month</Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {summary.procedures.map((p) => (
                    <View
                      key={p.procedureType}
                      className="min-w-[45%] flex-1 rounded-xl bg-slate-50 px-3 py-3 sm:min-w-[30%]">
                      <Text className="text-lg font-bold text-slate-900">{p.count}</Text>
                      <Text className="text-xs font-medium text-slate-600" numberOfLines={2}>
                        {p.procedureType}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Top outstanding balances
              </Text>
              {debts.length === 0 ? (
                <Text className="text-sm text-slate-400">No receivables</Text>
              ) : (
                debts.map((d, i) => (
                  <View
                    key={d.patientId}
                    className={`flex-row items-center justify-between py-2 ${
                      i < debts.length - 1 ? 'border-b border-slate-100' : ''
                    }`}>
                    <Text className="flex-1 pr-2 text-sm font-medium text-slate-800">
                      {d.firstName} {d.lastName}
                    </Text>
                    <Text className="text-sm font-semibold text-amber-800">
                      {eur(d.balanceOwed)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <Text className="text-slate-500">Unable to load reports.</Text>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default ReportsScreen;
