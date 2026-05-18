/**
 * Patient account ledger with optional myDATA submission on payment lines (Greek UI).
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {getPatientById} from '../../services/patient';
import {
  getPatientAccountSummary,
  getPatientLedger,
  PAYMENT_METHODS,
  recordPayment,
  type LedgerEntry,
} from '../../services/financial/payment.service';
import {
  submitReceiptToMyData,
  submitToMyData,
} from '../../services/financial/mydata.service';
import {
  createReceiptForPayment,
  getReceiptByPaymentId,
  paymentHasReceipt,
} from '../../services/financial/receipt.service';
import {useAuthStore} from '../../store/auth.store';
import {deleteTreatment} from '../../services/clinical/treatment.service';
import SwipeToRevealAction from '../../components/common/SwipeToRevealAction';
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
  issueReceipt: '\u0388\u03BA\u03B4\u03BF\u03C3\u03B7 \u03B1\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7\u03C2',
  invoicesLink: '\u03A4\u03B9\u03BC\u03BF\u03BB\u03CC\u03B3\u03B9\u03B1 & \u03B1\u03C0\u03BF\u03B4\u03B5\u03AF\u03BE\u03B5\u03B9\u03C2',
  missingAfmHint: '\u039B\u03B5\u03AF\u03C0\u03B5\u03B9 \u0391\u03A6\u039C',
  alertTitle: 'myDATA (\u03C0\u03C1\u03BF\u03C3\u03BF\u03BC\u03BF\u03AF\u03C9\u03C3\u03B7)',
  alertErr: '\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1',
  alertErrBody: '\u0391\u03B4\u03C5\u03BD\u03B1\u03BC\u03AF\u03B1 \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE\u03C2 \u03C3\u03C4\u03BF myDATA',
  balanceLabel: '\u03A5\u03C0\u03CC\u03BB\u03BF\u03B9\u03C0\u03BF',
  recordPayment: '\u039A\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2',
  legendCharges:
    '\u03A7\u03C1\u03AD\u03C9\u03C3\u03B7 (\u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1): \u03BA\u03B1\u03C6\u03AD \u03C0\u03BF\u03C3\u03CC \u03BC\u03B5 + (\u03BF \u03B1\u03C3\u03B8\u03B5\u03BD\u03AE\u03C2 \u03C7\u03C1\u03B5\u03CE\u03BD\u03B5\u03C4\u03B1\u03B9).',
  legendPayments:
    '\u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE: \u03C0\u03C1\u03AC\u03C3\u03B9\u03BD\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03AE \u03BC\u03B5 \u2212 (\u03C4\u03B1 \u03C7\u03C1\u03AE\u03C3\u03B1\u03BC\u03B5). \u039C\u03B5\u03C4\u03AC: \u00AB\u0388\u03BA\u03B4\u03BF\u03C3\u03B7 \u03B1\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7\u03C2\u00BB \u2192 \u00AB\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u03C3\u03C4\u03BF myDATA\u00BB.',
  totalCharges: '\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03C7\u03C1\u03B5\u03CE\u03C3\u03B5\u03C9\u03BD',
  totalPayments: '\u03A0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03C2',
  noCostHint:
    '\u03A0\u03BF\u03C3\u03CC \u20AC0 \u2014 \u03AC\u03BD\u03BF\u03B9\u03BE\u03B5 Dental Chart, \u03C0\u03AC\u03C4\u03B1 \u03C4\u03BF \u03B4\u03CC\u03BD\u03C4\u03B9, \u03B5\u03C0\u03AD\u03BB\u03B5\u03BE\u03B5 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1 \u03BA\u03B1\u03B9 \u03B2\u03AC\u03BB\u03B5 \u03BA\u03CC\u03C3\u03C4\u03BF\u03C2 (\u03C0.\u03C7. 15 \u03AE 60).',
  zeroChargesBanner:
    '\u039F\u03B9 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B5\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03C0\u03BF\u03C3\u03CC. \u03A4\u03BF \u03C5\u03C0\u03CC\u03BB\u03BF\u03B9\u03C0\u03BF \u03B4\u03B5\u03BD \u03BC\u03C0\u03BF\u03C1\u03B5\u03AF \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u20AC60 \u03BC\u03AD\u03C7\u03C1\u03B9 \u03BD\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03B7\u03B8\u03BF\u03CD\u03BD \u03C0\u03BF\u03C3\u03AC \u03C3\u03C4\u03BF chart.',
  payModalTitle: '\u039A\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2',
  paySaved: '\u0397 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B5.',
  swipeDeleteHint:
    '\u03A3\u03CD\u03C1\u03B5 \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AC \u2192 \u00AB\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE\u00BB \u03AE \u03C0\u03AC\u03C4\u03B1 \u03C4\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03AE \u03B3\u03B9\u03B1 \u03B5\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 \u03C3\u03C4\u03BF chart.',
  deleteAction: '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE',
  deleteChargeTitle: '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C7\u03C1\u03AD\u03C9\u03C3\u03B7\u03C2',
  deleteChargeCancel: '\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7',
  deleteChargeConfirm: '\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE',
  deleteChargeOk: '\u0397 \u03B8\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1 \u03B1\u03C6\u03B1\u03B9\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5.',
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
  const navigation = useNavigation<any>();
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;
  const {user} = useAuthStore();

  const [patientName, setPatientName] = useState('');
  const [patientAfm, setPatientAfm] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [deletingTreatmentId, setDeletingTreatmentId] = useState<string | null>(
    null,
  );
  const [summary, setSummary] = useState({
    totalCharges: 0,
    totalPayments: 0,
    balance: 0,
  });
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS.CASH);
  const [payNotes, setPayNotes] = useState('');
  const [paySaving, setPaySaving] = useState(false);

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
      setSummary(getPatientAccountSummary(patientId));
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

  const onIssueReceipt = async (paymentId: string) => {
    try {
      setBusyPaymentId(paymentId);
      const rec = createReceiptForPayment(paymentId, user?.id ?? null);
      Alert.alert(
        T.issueReceipt,
        `\u0391\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7 ${rec.receiptNumber}`,
      );
      void load();
    } catch (e) {
      console.error(e);
      Alert.alert(
        T.alertErr,
        e instanceof Error ? e.message : 'Could not issue receipt.',
      );
    } finally {
      setBusyPaymentId(null);
    }
  };

  const openPayModal = () => {
    const bal = summary.balance;
    setPayAmount(bal > 0 ? bal.toFixed(2).replace('.', ',') : '');
    setPayMethod(PAYMENT_METHODS.CASH);
    setPayNotes('');
    setPayModalOpen(true);
  };

  const submitPayment = () => {
    const normalized = payAmount.replace(',', '.');
    const amt = Number.parseFloat(normalized);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(T.alertErr, '\u0395\u03B9\u03C3\u03AC\u03B3\u03B5\u03C4\u03B5 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03C0\u03BF\u03C3\u03CC.');
      return;
    }
    setPaySaving(true);
    try {
      recordPayment({
        patientId,
        amount: amt,
        paymentMethod: payMethod,
        notes: payNotes.trim() || null,
        receiptIssued: false,
      });
      setPayModalOpen(false);
      void load();
      Alert.alert(T.payModalTitle, T.paySaved);
    } catch (e) {
      console.error(e);
      Alert.alert(T.alertErr, '\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03B7 \u03BA\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B7\u03C3\u03B7.');
    } finally {
      setPaySaving(false);
    }
  };

  const confirmDeleteCharge = (item: LedgerEntry) => {
    Alert.alert(
      T.deleteChargeTitle,
      `\u039D\u03B1 \u03B4\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03B5\u03AF \u00AB${item.description}\u00BB (${currencyEl(item.amount)});\n\n\u03A4\u03BF \u03BF\u03B4\u03BF\u03BD\u03C4\u03CC\u03B3\u03C1\u03B1\u03BC\u03BC\u03B1 \u03B8\u03B1 \u03B5\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03B8\u03B5\u03AF.`,
      [
        {text: T.deleteChargeCancel, style: 'cancel'},
        {
          text: T.deleteChargeConfirm,
          style: 'destructive',
          onPress: () => void runDeleteCharge(item.id),
        },
      ],
    );
  };

  const runDeleteCharge = async (treatmentId: string) => {
    try {
      setDeletingTreatmentId(treatmentId);
      await deleteTreatment(treatmentId, patientId);
      await load();
      Alert.alert(T.deleteChargeTitle, T.deleteChargeOk);
    } catch (e) {
      console.error(e);
      Alert.alert(
        T.alertErr,
        e instanceof Error ? e.message : 'Could not delete treatment.',
      );
    } finally {
      setDeletingTreatmentId(null);
    }
  };

  const onSubmitMyData = async (paymentId: string) => {
    if (!afmOk) {
      return;
    }
    try {
      setBusyPaymentId(paymentId);
      const receipt = getReceiptByPaymentId(paymentId);
      const mark = receipt
        ? await submitReceiptToMyData(receipt.id)
        : await submitToMyData(paymentId);
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

  const renderLedgerEntry = (item: LedgerEntry) => {
    const isDebit = item.kind === 'debit';
    const amountColor = isDebit ? 'text-amber-800' : 'text-emerald-800';
    const amountPrefix = isDebit ? '+' : '−';
    const hasReceipt = item.kind === 'credit' && paymentHasReceipt(item.id);
    const showMyData =
      item.kind === 'credit' &&
      hasReceipt &&
      (item.mydataMark == null || item.mydataMark === '');
    const showIssueReceipt = item.kind === 'credit' && !hasReceipt;
    const hasMark = Boolean(
      item.kind === 'credit' &&
        item.mydataMark != null &&
        item.mydataMark !== '',
    );
    const isDeleting = deletingTreatmentId === item.id;

    const card = (
      <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-medium uppercase text-slate-500">
              {isDebit ? T.charge : T.payment}
            </Text>
            <Text className="mt-1 text-sm text-slate-800">{item.description}</Text>
            <Text className="mt-1 text-xs text-slate-500">{formatWhen(item.occurredAt)}</Text>
            {item.notes ? (
              <Text className="mt-2 text-xs text-slate-600">{item.notes}</Text>
            ) : null}
            {isDebit && item.amount < 0.005 ? (
              <Text className="mt-2 text-xs font-medium text-amber-800">{T.noCostHint}</Text>
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
              <Text className="mt-2 text-xs text-emerald-700">{T.receiptRecorded}</Text>
            ) : null}
          </View>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#b45309" />
          ) : (
            <Text className={`text-base font-bold ${amountColor}`}>
              {amountPrefix}
              {currencyEl(item.amount)}
            </Text>
          )}
        </View>

        {showIssueReceipt ? (
          <View className="mt-3">
            <Pressable
              disabled={busyPaymentId === item.id}
              onPress={() => void onIssueReceipt(item.id)}
              className="flex-row items-center justify-center rounded-lg border border-violet-200 bg-violet-50 py-2.5 active:bg-violet-100 disabled:opacity-50">
              {busyPaymentId === item.id ? (
                <ActivityIndicator size="small" color="#6d28d9" />
              ) : (
                <>
                  <MaterialIcons name="receipt" size={18} color="#6d28d9" />
                  <Text className="ml-2 text-sm font-semibold text-violet-800">
                    {T.issueReceipt}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {showMyData ? (
          <View className="mt-3">
            <Pressable
              disabled={!afmOk || busyPaymentId === item.id}
              onPress={() => void onSubmitMyData(item.id)}
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

    if (!isDebit) {
      return card;
    }

    return (
      <SwipeToRevealAction
        enabled={!isDeleting}
        actionLabel={T.deleteAction}
        onActionPress={() => confirmDeleteCharge(item)}>
        {card}
      </SwipeToRevealAction>
    );
  };

  const listHeader = (
    <>
      <Text className="text-lg font-semibold text-slate-900">
        {`${patientName || T.patientFallback} \u2014 \u03BB\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2`}
      </Text>
      <Text className="mt-1 text-sm text-slate-600">{T.intro}</Text>

      <View className="mt-4 gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">{T.totalCharges}</Text>
          <Text className="text-sm font-semibold text-amber-900">
            +{currencyEl(summary.totalCharges)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">{T.totalPayments}</Text>
          <Text className="text-sm font-semibold text-emerald-800">
            −{currencyEl(summary.totalPayments)}
          </Text>
        </View>
        <View className="mt-1 flex-row justify-between border-t border-slate-100 pt-2">
          <Text className="text-sm font-medium text-slate-700">{T.balanceLabel}</Text>
          <Text
            className={`text-lg font-bold ${
              summary.balance > 0.005 ? 'text-amber-800' : 'text-emerald-700'
            }`}>
            {currencyEl(summary.balance)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={openPayModal}
        className="mt-3 flex-row items-center justify-center rounded-xl bg-emerald-700 py-3.5 active:bg-emerald-800">
        <MaterialIcons name="payments" size={22} color="#fff" />
        <Text className="ml-2 text-base font-semibold text-white">{T.recordPayment}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('PatientInvoices', {patientId})}
        className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50">
        <MaterialIcons name="receipt-long" size={20} color="#0f172a" />
        <Text className="ml-2 text-sm font-semibold text-slate-900">{T.invoicesLink}</Text>
      </Pressable>

      <View className="mt-4 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <Text className="text-xs text-slate-700">{T.legendCharges}</Text>
        <Text className="text-xs text-slate-700">{T.legendPayments}</Text>
        <Text className="text-xs font-medium text-slate-600">{T.swipeDeleteHint}</Text>
      </View>

      {summary.totalCharges < 0.005 && summary.balance > 0.005 ? (
        <View className="mt-3 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <MaterialIcons name="warning-amber" size={22} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-900">{T.zeroChargesBanner}</Text>
        </View>
      ) : null}

      {entries.some((e) => e.kind === 'debit' && e.amount < 0.005) ? (
        <View className="mt-3 flex-row gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <MaterialIcons name="info-outline" size={22} color="#1d4ed8" />
          <Text className="flex-1 text-sm text-blue-900">{T.noCostHint}</Text>
        </View>
      ) : null}

      {!afmOk ? (
        <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <MaterialIcons name="info-outline" size={22} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-900">{T.afmBanner}</Text>
        </View>
      ) : null}
    </>
  );

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
    <FlatList
      className="flex-1 bg-slate-50"
      directionalLockEnabled
      data={entries}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={({item}) => (
        <View className="mb-3">{renderLedgerEntry(item)}</View>
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-10">
          <MaterialIcons name="receipt-long" size={40} color="#94a3b8" />
          <Text className="mt-2 text-slate-600">{T.noMovements}</Text>
        </View>
      }
      contentContainerStyle={{padding: pad, paddingBottom: 32}}
      keyboardShouldPersistTaps="handled"
    />

    <Modal visible={payModalOpen} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPayModalOpen(false)}>
          <Pressable
            className="rounded-t-2xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-slate-900">{T.payModalTitle}</Text>
            <Text className="mt-1 text-sm text-slate-600">{patientName}</Text>
            <Text className="text-sm text-amber-800">
              {T.balanceLabel}: {currencyEl(summary.balance)}
            </Text>

            <Text className="mb-1 mt-4 text-xs font-medium text-slate-600">
              {'\u03A0\u03BF\u03C3\u03CC (\u20AC)'}
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text className="mb-1 text-xs font-medium text-slate-600">
              {'\u03A4\u03C1\u03CC\u03C0\u03BF\u03C2 \u03C0\u03BB\u03B7\u03C1\u03C9\u03BC\u03AE\u03C2'}
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {[
                PAYMENT_METHODS.CASH,
                PAYMENT_METHODS.CARD,
                PAYMENT_METHODS.BANK_TRANSFER,
              ].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setPayMethod(m)}
                  className={`rounded-full border-2 px-3 py-2 ${
                    payMethod === m ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-medium ${
                      payMethod === m ? 'text-blue-800' : 'text-slate-700'
                    }`}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1 text-xs text-slate-600">{'\u03A3\u03B7\u03BC\u03B5\u03AF\u03C9\u03C3\u03B7'}</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={payNotes}
              onChangeText={setPayNotes}
              placeholder="Optional"
              placeholderTextColor="#94a3b8"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setPayModalOpen(false)}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">
                  {'\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7'}
                </Text>
              </Pressable>
              <Pressable
                onPress={submitPayment}
                disabled={paySaving}
                className="flex-1 items-center rounded-xl bg-emerald-700 py-3 disabled:opacity-50">
                {paySaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">
                    {'\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7'}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
    </ScreenSafeArea>
  );
};

export default PatientLedgerScreen;
