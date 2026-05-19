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
import {
  el,
  ledgerAccountTitle,
  ledgerDeleteChargeBody,
  ledgerMydataSuccessBody,
  ledgerReceiptBody,
  paymentMethodLabel,
  UI_LOCALE,
} from '../../i18n';

const currencyEl = (n: number) =>
  new Intl.NumberFormat(UI_LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const formatWhen = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(UI_LOCALE, {
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
        el.ledger.issueReceipt,
        ledgerReceiptBody(rec.receiptNumber),
      );
      void load();
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.ledger.alertErr,
        e instanceof Error ? e.message : el.ledger.issueReceiptFailed,
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
      Alert.alert(el.ledger.alertErr, el.ledger.invalidAmount);
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
      Alert.alert(el.ledger.payModalTitle, el.ledger.paySaved);
    } catch (e) {
      console.error(e);
      Alert.alert(el.ledger.alertErr, el.ledger.paymentFailed);
    } finally {
      setPaySaving(false);
    }
  };

  const confirmDeleteCharge = (item: LedgerEntry) => {
    Alert.alert(
      el.ledger.deleteChargeTitle,
      ledgerDeleteChargeBody(item.description, currencyEl(item.amount)),
      [
        {text: el.common.cancel, style: 'cancel'},
        {
          text: el.common.delete,
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
      Alert.alert(el.ledger.deleteChargeTitle, el.ledger.deleteChargeOk);
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.ledger.alertErr,
        e instanceof Error ? e.message : el.ledger.deleteTreatmentFailed,
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
      Alert.alert(el.ledger.alertTitle, ledgerMydataSuccessBody(mark));
      void load();
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.ledger.alertErr,
        e instanceof Error ? e.message : el.ledger.alertErrBody,
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
              {isDebit ? el.ledger.charge : el.ledger.payment}
            </Text>
            <Text className="mt-1 text-sm text-slate-800">{item.description}</Text>
            <Text className="mt-1 text-xs text-slate-500">{formatWhen(item.occurredAt)}</Text>
            {item.notes ? (
              <Text className="mt-2 text-xs text-slate-600">{item.notes}</Text>
            ) : null}
            {isDebit && item.amount < 0.005 ? (
              <Text className="mt-2 text-xs font-medium text-amber-800">{el.ledger.noCostHint}</Text>
            ) : null}

            {hasMark ? (
              <View className="mt-3 flex-row items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2">
                <MaterialIcons name="check-circle" size={20} color="#059669" />
                <View className="min-w-0 flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    {el.ledger.mydataSubmitted}
                  </Text>
                  <Text
                    className="mt-0.5 text-sm font-medium text-emerald-900"
                    selectable>
                    {item.mydataMark}
                  </Text>
                  {item.receiptIssued ? (
                    <Text className="mt-1 text-xs text-emerald-700">
                      {el.ledger.receiptRecorded}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {!isDebit && !hasMark && item.receiptIssued ? (
              <Text className="mt-2 text-xs text-emerald-700">{el.ledger.receiptRecorded}</Text>
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
                    {el.ledger.issueReceipt}
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
                    {el.ledger.submitMydata}
                  </Text>
                </>
              )}
            </Pressable>
            {!afmOk ? (
              <Text className="mt-2 text-center text-xs font-medium text-amber-800">
                {el.ledger.missingAfmHint}
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
        actionLabel={el.ledger.deleteAction}
        onActionPress={() => confirmDeleteCharge(item)}>
        {card}
      </SwipeToRevealAction>
    );
  };

  const listHeader = (
    <>
      <Text className="text-lg font-semibold text-slate-900">
        {ledgerAccountTitle(patientName)}
      </Text>
      <Text className="mt-1 text-sm text-slate-600">{el.ledger.intro}</Text>

      <View className="mt-4 gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">{el.ledger.totalCharges}</Text>
          <Text className="text-sm font-semibold text-amber-900">
            +{currencyEl(summary.totalCharges)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-600">{el.ledger.totalPayments}</Text>
          <Text className="text-sm font-semibold text-emerald-800">
            −{currencyEl(summary.totalPayments)}
          </Text>
        </View>
        <View className="mt-1 flex-row justify-between border-t border-slate-100 pt-2">
          <Text className="text-sm font-medium text-slate-700">{el.ledger.balanceLabel}</Text>
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
        <Text className="ml-2 text-base font-semibold text-white">{el.ledger.recordPayment}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('PatientInvoices', {patientId})}
        className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50">
        <MaterialIcons name="receipt-long" size={20} color="#0f172a" />
        <Text className="ml-2 text-sm font-semibold text-slate-900">{el.ledger.invoicesLink}</Text>
      </Pressable>

      <View className="mt-4 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <Text className="text-xs text-slate-700">{el.ledger.legendCharges}</Text>
        <Text className="text-xs text-slate-700">{el.ledger.legendPayments}</Text>
        <Text className="text-xs font-medium text-slate-600">{el.ledger.swipeDeleteHint}</Text>
      </View>

      {summary.totalCharges < 0.005 && summary.balance > 0.005 ? (
        <View className="mt-3 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <MaterialIcons name="warning-amber" size={22} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-900">{el.ledger.zeroChargesBanner}</Text>
        </View>
      ) : null}

      {entries.some((e) => e.kind === 'debit' && e.amount < 0.005) ? (
        <View className="mt-3 flex-row gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <MaterialIcons name="info-outline" size={22} color="#1d4ed8" />
          <Text className="flex-1 text-sm text-blue-900">{el.ledger.noCostHint}</Text>
        </View>
      ) : null}

      {!afmOk ? (
        <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <MaterialIcons name="info-outline" size={22} color="#b45309" />
          <Text className="flex-1 text-sm text-amber-900">{el.ledger.afmBanner}</Text>
        </View>
      ) : null}
    </>
  );

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-slate-600">{el.ledger.loading}</Text>
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
          <Text className="mt-2 text-slate-600">{el.ledger.noMovements}</Text>
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
            <Text className="text-lg font-bold text-slate-900">{el.ledger.payModalTitle}</Text>
            <Text className="mt-1 text-sm text-slate-600">{patientName}</Text>
            <Text className="text-sm text-amber-800">
              {el.ledger.balanceLabel}: {currencyEl(summary.balance)}
            </Text>

            <Text className="mb-1 mt-4 text-xs font-medium text-slate-600">
              {el.ledger.amountEur}
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text className="mb-1 text-xs font-medium text-slate-600">
              {el.ledger.paymentMethod}
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
                    {paymentMethodLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1 text-xs text-slate-600">{el.ledger.notesOptional}</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={payNotes}
              onChangeText={setPayNotes}
              placeholder={el.common.notes}
              placeholderTextColor="#94a3b8"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setPayModalOpen(false)}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">{el.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={submitPayment}
                disabled={paySaving}
                className="flex-1 items-center rounded-xl bg-emerald-700 py-3 disabled:opacity-50">
                {paySaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">{el.common.save}</Text>
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
