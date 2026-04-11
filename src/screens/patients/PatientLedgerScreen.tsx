/**
 * Patient account ledger with optional myDATA submission on payment lines (Greek UI).
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {getPatientById} from '../../services/patient';
import {
  getPatientLedger,
  type LedgerEntry,
} from '../../services/financial/payment.service';
import {submitToMyData} from '../../services/financial/mydata.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

/** Greek copy (UTF-16 escapes for stable source encoding). */
const T = {
  loading: '\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03B9\u03BA\u03AE\u03C2\u2026',
  patientFallback: '\u0391\u03C3\u03B8\u03B5\u03BD\u03AE\u03C2',
  intro:
    '\u03A7\u03C1\u03B5\u03CE\u03C3\u03B5\u03B9\u03C2 (\u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2) \u03BA\u03B1\u03B9 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03C2. \u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03BF myDATA \u03B3\u03B9\u03B1 \u03BA\u03AC\u03B8\u03B5 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE \u03CC\u03C4\u03B1\u03BD \u03B1\u03C0\u03B1\u03B9\u03C4\u03B5\u03AF\u03C4\u03B1\u03B9.',
  afmBanner:
    '\u039B\u03B5\u03AF\u03C0\u03B5\u03B9 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u0391\u03A6\u039C (9 \u03C8\u03B7\u03C6\u03AF\u03B1). \u0397 \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03BF myDATA \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B1\u03C0\u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u2014 \u03C3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03BF \u0391\u03A6\u039C \u03C3\u03C4\u03BF \u03C0\u03C1\u03BF\u03C6\u03AF\u03BB \u03C4\u03BF\u03C5 \u03B1\u03C3\u03B8\u03B5\u03BD\u03BF\u03CD\u03C2.',
  noMovements: '\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03BA\u03B9\u03BD\u03AE\u03C3\u03B5\u03B9\u03C2.',
  charge: '\u03A7\u03C1\u03AD\u03C9\u03C3\u03B7',
  payment: '\u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE',
  mydataSubmitted: 'myDATA \u2014 \u03C5\u03C0\u03BF\u03B2\u03BB\u03AE\u03B8\u03B7\u03BA\u03B5',
  receiptRecorded: '\u0391\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03B7\u03BC\u03AD\u03BD\u03B7',
  submitMydata: '\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03BF myDATA',
  missingAfmHint: '\u039B\u03B5\u03AF\u03C0\u03B5\u03B9 \u0391\u03A6\u039C',
  alertTitle: 'myDATA (\u03C0\u03C1\u03BF\u03C3\u03BF\u03BC\u03BF\u03AF\u03C9\u03C3\u03B7)',
  alertErr: '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
  alertErrBody: '\u0391\u03B4\u03C5\u03BD\u03B1\u03BC\u03AF\u03B1 \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE\u03C2 \u03C3\u03C4\u03BF myDATA',
} as const;

const currencyEl = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const formatWhen = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

function isValidGreekAfm(value: string | undefined): boolean {
  return /^\d{9}$/.test((value ?? '').trim());
}

const PatientLedgerScreen: React.FC = () => {
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;

  const [patientName, setPatientName] = useState('');
  const [patientAfm, setPatientAfm] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);

  const afmOk = isValidGreekAfm(patientAfm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getPatientById(patientId);
      if (p) {
        setPatientName(`${p.firstName} ${p.lastName}`);
        setPatientAfm(p.afm);
      } else {
        setPatientName('');
        setPatientAfm(undefined);
      }
      setEntries(getPatientLedger(patientId));
    } catch (e) {
      console.error(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSubmitMyData = async (paymentId: string) => {
    if (!afmOk) {
      return;
    }
    try {
      setBusyPaymentId(paymentId);
      const mark = await submitToMyData(paymentId);
      Alert.alert(
        T.alertTitle,
        `\u0397 \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u03BA\u03B1\u03C4\u03B1\u03B3\u03C1\u03AC\u03C6\u03B7\u03BA\u03B5 \u03C3\u03C4\u03B7\u03BD \u03BA\u03BF\u03BD\u03C3\u03CC\u03BB\u03B1. \u0391\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC: ${mark}`,
      );
      void load();
    } catch (e) {
      console.error(e);
      Alert.alert(
        T.alertErr,
        e instanceof Error ? e.message : T.alertErrBody,
      );
    } finally {
      setBusyPaymentId(null);
    }
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-slate-600">{T.loading}</Text>
      </View>
      </ScreenSafeArea>
    );
  }

  return (
    <ScreenSafeArea variant="content">
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{padding: pad, paddingBottom: 32}}>
      <Text className="text-lg font-semibold text-slate-900">
        {`${patientName || T.patientFallback} \u2014 \u03BB\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2`}
      </Text>
      <Text className="mt-1 text-sm text-slate-600">{T.intro}</Text>

      {!afmOk ? (
        <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <MaterialIcons name="info-outline" size={22} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-900">{T.afmBanner}</Text>
        </View>
      ) : null}

      {entries.length === 0 ? (
        <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-10">
          <MaterialIcons name="receipt-long" size={40} color="#94a3b8" />
          <Text className="mt-2 text-slate-600">{T.noMovements}</Text>
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {entries.map((item) => {
            const isDebit = item.kind === 'debit';
            const amountColor = isDebit ? 'text-amber-800' : 'text-emerald-800';
            const amountPrefix = isDebit ? '+' : '−';

            const showMyData =
              item.kind === 'credit' &&
              (item.mydataMark == null || item.mydataMark === '');

            const hasMark = Boolean(
              item.kind === 'credit' &&
                item.mydataMark != null &&
                item.mydataMark !== '',
            );

            return (
              <View
                key={`${item.kind}-${item.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs font-medium uppercase text-slate-500">
                      {isDebit ? T.charge : T.payment}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-800">
                      {item.description}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                      {formatWhen(item.occurredAt)}
                    </Text>
                    {item.notes ? (
                      <Text className="mt-2 text-xs text-slate-600">{item.notes}</Text>
                    ) : null}

                    {hasMark ? (
                      <View className="mt-3 flex-row items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2">
                        <MaterialIcons name="check-circle" size={20} color="#059669" />
                        <View className="min-w-0 flex-1">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                            {T.mydataSubmitted}
                          </Text>
                          <Text
                            className="mt-0.5 text-sm font-medium text-emerald-900"
                            selectable>
                            {item.mydataMark}
                          </Text>
                          {item.receiptIssued ? (
                            <Text className="mt-1 text-xs text-emerald-700">
                              {T.receiptRecorded}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : null}

                    {!isDebit && !hasMark && item.receiptIssued ? (
                      <Text className="mt-2 text-xs text-emerald-700">
                        {T.receiptRecorded}
                      </Text>
                    ) : null}
                  </View>
                  <Text className={`text-base font-bold ${amountColor}`}>
                    {amountPrefix}
                    {currencyEl(item.amount)}
                  </Text>
                </View>

                {showMyData ? (
                  <View className="mt-3">
                    <Pressable
                      disabled={!afmOk || busyPaymentId === item.id}
                      onPress={() => onSubmitMyData(item.id)}
                      className={`flex-row items-center justify-center rounded-lg border py-2.5 ${
                        afmOk
                          ? 'border-blue-200 bg-blue-50 active:bg-blue-100'
                          : 'border-slate-200 bg-slate-100'
                      } disabled:opacity-50`}>
                      {busyPaymentId === item.id ? (
                        <ActivityIndicator size="small" color="#1d4ed8" />
                      ) : (
                        <>
                          <MaterialIcons
                            name="cloud-upload"
                            size={18}
                            color={afmOk ? '#1d4ed8' : '#94a3b8'}
                          />
                          <Text
                            className={`ml-2 text-sm font-semibold ${
                              afmOk ? 'text-blue-800' : 'text-slate-500'
                            }`}>
                            {T.submitMydata}
                          </Text>
                        </>
                      )}
                    </Pressable>
                    {!afmOk ? (
                      <Text className="mt-2 text-center text-xs font-medium text-amber-800">
                        {T.missingAfmHint}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
    </ScreenSafeArea>
  );
};

export default PatientLedgerScreen;
