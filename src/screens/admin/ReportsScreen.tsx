/**
 * Management reports (Module K+) — monthly KPIs, receivables, pending invoices.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ReportsStackParamList} from '../../navigation/navigation.types';
import {MaterialIcons} from '@expo/vector-icons';
import {isDatabaseAvailable} from '../../services/database';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import {
  getMonthSummary,
  getOutstandingDebts,
  getReportsOverview,
  type MonthSummary,
  type OutstandingDebtRow,
  type ReportsOverview,
} from '../../services/admin/report.service';
import {shareMonthlyReportCsv} from '../../services/admin/reportExport.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el, formatCurrencyEur, invoiceStatusLabel, UI_LOCALE} from '../../i18n';

const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat(UI_LOCALE, {month: 'long', year: 'numeric'}).format(
    new Date(y, m - 1, 1),
  );

const KpiCard: React.FC<{
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  accent: string;
  minWidth: number;
}> = ({title, value, hint, icon, accent, minWidth}) => (
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
    {hint ? (
      <Text className="mt-1 text-xs text-slate-500">{hint}</Text>
    ) : null}
  </View>
);

const ReportsScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<ReportsStackParamList>>();
  const {width} = useWindowDimensions();
  const isWide = width >= 840;
  const cardMinW = width >= 900 ? width * 0.28 : width * 0.42;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [debts, setDebts] = useState<OutstandingDebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      setSummary(null);
      setOverview(null);
      setDebts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, o, d] = await Promise.all([
        getMonthSummary(month, year),
        getReportsOverview(20),
        getOutstandingDebts(15),
      ]);
      setSummary(s);
      setOverview(o);
      setDebts(d);
    } catch (e) {
      console.error(e);
      setSummary(null);
      setOverview(null);
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

  const onExportCsv = async () => {
    try {
      setExporting(true);
      await shareMonthlyReportCsv(month, year);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.reports.exportCsvFailed,
      );
    } finally {
      setExporting(false);
    }
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
          <Text className="text-2xl font-bold text-slate-900">{el.reports.title}</Text>
          <Text className="mt-1 text-sm text-slate-600">{el.reports.subtitle}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Inventory')}
          className="mx-2 mb-4 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm active:bg-slate-50">
          <View className="mr-3 rounded-full bg-indigo-100 p-2">
            <MaterialIcons name="inventory-2" size={26} color="#4f46e5" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900">
              {el.reports.openInventory}
            </Text>
            <Text className="text-sm text-slate-500">
              {el.reports.openInventoryHint}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
        </Pressable>

        <View className="mb-4 flex-row items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
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
        ) : summary && overview ? (
          <>
            <Text className="mb-2 px-2 text-xs text-slate-500">
              {el.reports.revenueVsChargesHint}
            </Text>

            <View className="mb-2 flex-row flex-wrap justify-between gap-3">
              <KpiCard
                title={el.reports.revenue}
                value={formatCurrencyEur(summary.revenue)}
                icon="payments"
                accent="#059669"
                minWidth={cardMinW}
              />
              <KpiCard
                title={el.reports.charges}
                value={formatCurrencyEur(summary.charges)}
                icon="receipt-long"
                accent="#d97706"
                minWidth={cardMinW}
              />
              <KpiCard
                title={el.reports.newPatients}
                value={String(summary.newPatients)}
                icon="person-add"
                accent="#2563eb"
                minWidth={cardMinW}
              />
            </View>

            <View className="mb-4 flex-row flex-wrap justify-between gap-3">
              <KpiCard
                title={el.reports.totalReceivables}
                value={formatCurrencyEur(overview.totalReceivables)}
                hint={el.reports.totalReceivablesHint}
                icon="account-balance-wallet"
                accent="#7c3aed"
                minWidth={cardMinW}
              />
              <KpiCard
                title={el.reports.pendingInvoices}
                value={`${overview.pendingInvoiceCount} · ${formatCurrencyEur(overview.pendingInvoiceAmount)}`}
                hint={el.reports.pendingInvoicesHint}
                icon="description"
                accent="#dc2626"
                minWidth={cardMinW}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={exporting}
              onPress={() => void onExportCsv()}
              className="mx-2 mb-6 flex-row items-center justify-center rounded-xl border border-slate-300 bg-white py-3 shadow-sm active:bg-slate-50">
              {exporting ? (
                <ActivityIndicator color="#334155" />
              ) : (
                <>
                  <MaterialIcons name="ios-share" size={22} color="#334155" />
                  <Text className="ml-2 text-base font-semibold text-slate-800">
                    {el.reports.exportCsvBtn}
                  </Text>
                </>
              )}
            </Pressable>

            <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {el.reports.pendingInvoices}
              </Text>
              {overview.pendingInvoices.length === 0 ? (
                <Text className="text-sm text-slate-400">
                  {el.reports.noPendingInvoices}
                </Text>
              ) : (
                overview.pendingInvoices.map((inv, i) => (
                  <View
                    key={inv.invoiceId}
                    className={`py-2 ${
                      i < overview.pendingInvoices.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }`}>
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-sm font-medium text-slate-800">
                        {inv.invoiceNumber} · {inv.firstName} {inv.lastName}
                      </Text>
                      <Text className="text-sm font-semibold text-slate-900">
                        {formatCurrencyEur(inv.totalAmount)}
                      </Text>
                    </View>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {invoiceStatusLabel(inv.status as 'draft' | 'issued' | 'paid' | 'cancelled')}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Text className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {el.reports.clinicalProcedures}
              </Text>
              {summary.procedures.length === 0 ? (
                <Text className="text-sm text-slate-400">{el.reports.noProceduresMonth}</Text>
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
                {el.reports.topOutstanding}
              </Text>
              {debts.length === 0 ? (
                <Text className="text-sm text-slate-400">{el.reports.noReceivables}</Text>
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
                      {formatCurrencyEur(d.balanceOwed)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <Text className="text-slate-500">{el.reports.loadFailed}</Text>
        )}
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default ReportsScreen;
