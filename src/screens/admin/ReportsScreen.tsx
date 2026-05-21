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
  getMonthlyFinancialSummary,
  getOutstandingDebts,
  getReportsOverview,
  percentChange,
  previousCalendarMonth,
  type MonthSummary,
  type MonthlyFinancialSummary,
  type OutstandingDebtRow,
  type ReportsOverview,
} from '../../services/admin/report.service';
import {shareMonthlyReportCsv} from '../../services/admin/reportExport.service';
import {shareMonthlyReportPdf} from '../../services/admin/reportPdf.service';
import {getInventorySummary} from '../../services/inventory/inventory.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {el, formatCurrencyEur, invoiceStatusLabel, UI_LOCALE} from '../../i18n';

const monthLabel = (y: number, m: number) =>
  new Intl.DateTimeFormat(UI_LOCALE, {month: 'long', year: 'numeric'}).format(
    new Date(y, m - 1, 1),
  );

function formatVsPrevHint(current: number, previous: number): string | undefined {
  const pct = percentChange(current, previous);
  let delta: string;
  if (pct === null) {
    delta = current > 0 ? el.reports.vsPrevMonthNew : el.reports.vsPrevMonthSame;
  } else if (pct === 0) {
    delta = el.reports.vsPrevMonthSame;
  } else {
    const abs = Math.abs(pct).toFixed(1).replace(/\.0$/, '');
    delta =
      pct > 0
        ? el.reports.vsPrevMonthUp.replace('{pct}', abs)
        : el.reports.vsPrevMonthDown.replace('{pct}', abs);
  }
  return el.reports.vsPrevMonthLabel.replace('{delta}', delta);
}

const KpiCard: React.FC<{
  title: string;
  value: string;
  hint?: string;
  comparisonHint?: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  accent: string;
  minWidth: number;
  onPress?: () => void;
}> = ({
  title,
  value,
  hint,
  comparisonHint,
  icon,
  accent,
  minWidth,
  onPress,
}) => {
  const content = (
    <>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </Text>
        <MaterialIcons name={icon} size={22} color={accent} />
      </View>
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
      {comparisonHint ? (
        <Text className="mt-1 text-xs font-medium text-indigo-600">
          {comparisonHint}
        </Text>
      ) : null}
      {hint ? (
        <Text className="mt-1 text-xs text-slate-500">{hint}</Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="mb-3 flex-grow rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
        style={{minWidth, flexBasis: minWidth}}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className="mb-3 flex-grow rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      style={{minWidth, flexBasis: minWidth}}>
      {content}
    </View>
  );
};

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
  const [prevSummary, setPrevSummary] = useState<MonthSummary | null>(null);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [debts, setDebts] = useState<OutstandingDebtRow[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [financial, setFinancial] = useState<MonthlyFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      setSummary(null);
      setPrevSummary(null);
      setOverview(null);
      setDebts([]);
      setLowStockCount(0);
      setFinancial(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const prev = previousCalendarMonth(month, year);
      const [s, ps, o, d, inv, fin] = await Promise.all([
        getMonthSummary(month, year),
        getMonthSummary(prev.month, prev.year),
        getReportsOverview(20),
        getOutstandingDebts(15),
        getInventorySummary(),
        getMonthlyFinancialSummary(month, year),
      ]);
      setSummary(s);
      setPrevSummary(ps);
      setOverview(o);
      setDebts(d);
      setLowStockCount(inv.lowStockCount);
      setFinancial(fin);
    } catch (e) {
      console.error(e);
      setSummary(null);
      setPrevSummary(null);
      setOverview(null);
      setDebts([]);
      setLowStockCount(0);
      setFinancial(null);
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
      setExportingCsv(true);
      await shareMonthlyReportCsv(month, year);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.reports.exportCsvFailed,
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const onExportPdf = async () => {
    try {
      setExportingPdf(true);
      await shareMonthlyReportPdf(month, year);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.reports.exportPdfFailed,
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const vs = prevSummary
    ? {
        revenue: formatVsPrevHint(summary!.revenue, prevSummary.revenue),
        charges: formatVsPrevHint(summary!.charges, prevSummary.charges),
        newPatients: formatVsPrevHint(
          summary!.newPatients,
          prevSummary.newPatients,
        ),
      }
    : null;

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
              {lowStockCount > 0
                ? el.reports.openInventoryLowStock.replace(
                    '{count}',
                    String(lowStockCount),
                  )
                : el.reports.openInventoryHint}
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
                comparisonHint={vs?.revenue}
                icon="payments"
                accent="#059669"
                minWidth={cardMinW}
              />
              <KpiCard
                title={el.reports.charges}
                value={formatCurrencyEur(summary.charges)}
                comparisonHint={vs?.charges}
                icon="receipt-long"
                accent="#d97706"
                minWidth={cardMinW}
              />
              <KpiCard
                title={el.reports.newPatients}
                value={String(summary.newPatients)}
                comparisonHint={vs?.newPatients}
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
              <KpiCard
                title={el.reports.lowStockKpi}
                value={String(lowStockCount)}
                hint={el.reports.lowStockKpiHint}
                icon="warning"
                accent="#ea580c"
                minWidth={cardMinW}
                onPress={() => navigation.navigate('Inventory')}
              />
            </View>

            {financial ? (
              <View className="mx-2 mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Text className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {el.reports.financialSectionTitle}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {el.reports.financialSectionHint}
                </Text>
                <View className="mt-3 gap-2">
                  {[
                    {
                      label: el.reports.finInvoicesIssued,
                      count: financial.invoicesIssuedCount,
                      amount: financial.invoicesIssuedAmount,
                    },
                    {
                      label: el.reports.finInvoicesPaid,
                      count: financial.invoicesPaidCount,
                      amount: financial.invoicesPaidAmount,
                    },
                    {
                      label: el.reports.finReceipts,
                      count: financial.receiptsCount,
                      amount: financial.receiptsGross,
                    },
                    {
                      label: el.reports.finReceiptsVat,
                      count: null as number | null,
                      amount: financial.receiptsVat,
                    },
                    {
                      label: el.reports.finPayments,
                      count: null as number | null,
                      amount: financial.paymentsTotal,
                    },
                  ].map((row) => (
                    <View
                      key={row.label}
                      className="flex-row items-center justify-between border-b border-slate-100 py-2 last:border-b-0">
                      <Text className="flex-1 text-sm text-slate-700">{row.label}</Text>
                      <Text className="text-sm font-semibold text-slate-900">
                        {row.count != null
                          ? el.reports.finCountAmount
                              .replace('{count}', String(row.count))
                              .replace('{amount}', formatCurrencyEur(row.amount))
                          : formatCurrencyEur(row.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mx-2 mb-6 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={exportingCsv || exportingPdf}
                onPress={() => void onExportCsv()}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-300 bg-white py-3 shadow-sm active:bg-slate-50">
                {exportingCsv ? (
                  <ActivityIndicator color="#334155" />
                ) : (
                  <>
                    <MaterialIcons name="ios-share" size={22} color="#334155" />
                    <Text className="ml-2 text-sm font-semibold text-slate-800">
                      {el.reports.exportCsvBtn}
                    </Text>
                  </>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={exportingCsv || exportingPdf}
                onPress={() => void onExportPdf()}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 py-3 shadow-sm active:bg-indigo-100">
                {exportingPdf ? (
                  <ActivityIndicator color="#4338ca" />
                ) : (
                  <>
                    <MaterialIcons name="picture-as-pdf" size={22} color="#4338ca" />
                    <Text className="ml-2 text-sm font-semibold text-indigo-900">
                      {el.reports.exportPdfBtn}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

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
