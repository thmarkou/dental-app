/**
 * Patient invoices (τιμολόγια) and receipts (αποδείξεις).
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {getPatientById} from '../../services/patient';
import {
  createInvoice,
  getInvoiceLines,
  getPatientInvoices,
  getTreatmentLineSuggestions,
  parseInvoiceLineDrafts,
  recordPaymentForInvoice,
  updateInvoiceStatus,
  type InvoiceRow,
  type InvoiceStatus,
} from '../../services/financial/invoice.service';
import {shareInvoicePdf} from '../../services/financial/invoicePdf.service';
import {shareReceiptPdf} from '../../services/financial/receiptPdf.service';
import InvoiceLinesEditor, {
  createEmptyLineDraft,
  draftsFromSuggestions,
  type InvoiceLineDraft,
} from '../../components/financial/InvoiceLinesEditor';
import {
  createReceipt,
  createReceiptForInvoice,
  getInvoiceFinancialLink,
  getPatientReceipts,
  getReceiptLines,
  parseReceiptLineDrafts,
  type InvoiceFinancialLink,
  type ReceiptRow,
} from '../../services/financial/receipt.service';
import {getInvoiceById} from '../../services/financial/invoice.service';
import {getPracticeSettings} from '../../services/settings/practiceSettings.service';
import {PAYMENT_METHODS} from '../../services/financial/payment.service';
import {submitReceiptToMyData} from '../../services/financial/mydata.service';
import {useAuthStore} from '../../store/auth.store';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {
  el,
  formatCurrencyEur,
  invoiceStatusLabel,
  paymentMethodLabel,
  UI_LOCALE,
} from '../../i18n';

type TabKey = 'invoices' | 'receipts';

const formatWhen = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(UI_LOCALE, {dateStyle: 'medium'}).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PatientInvoicesScreen: React.FC = () => {
  const route = useRoute();
  const {patientId} = route.params as {patientId: string};
  const {width} = useWindowDimensions();
  const pad = width >= 900 ? 24 : 16;
  const {user} = useAuthStore();

  const [tab, setTab] = useState<TabKey>('invoices');
  const [patientName, setPatientName] = useState('');
  const [afmOk, setAfmOk] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [invoiceLinks, setInvoiceLinks] = useState<
    Record<string, InvoiceFinancialLink | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [invoiceModal, setInvoiceModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [invoiceLineDrafts, setInvoiceLineDrafts] = useState<InvoiceLineDraft[]>([
    createEmptyLineDraft(),
  ]);
  const [receiptLineDrafts, setReceiptLineDrafts] = useState<InvoiceLineDraft[]>([
    createEmptyLineDraft(),
  ]);
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS.CASH);
  const [payModalInvoice, setPayModalInvoice] = useState<InvoiceRow | null>(null);
  const [invoicePayAmount, setInvoicePayAmount] = useState('');
  const defaultVatRate = getPracticeSettings().defaultVatRate;
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
        setAfmOk(/^\d{9}$/.test((patient.afm ?? '').trim()));
      }
      const invs = getPatientInvoices(patientId);
      setInvoices(invs);
      setReceipts(getPatientReceipts(patientId));
      const links: Record<string, InvoiceFinancialLink | null> = {};
      for (const inv of invs) {
        links[inv.id] = getInvoiceFinancialLink(inv.id);
      }
      setInvoiceLinks(links);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openInvoiceModal = () => {
    const suggestions = getTreatmentLineSuggestions(patientId);
    setInvoiceLineDrafts(
      suggestions.length > 0
        ? draftsFromSuggestions(suggestions)
        : [
            {
              ...createEmptyLineDraft(),
              description: el.invoices.defaultService,
            },
          ],
    );
    setInvoiceModal(true);
  };

  const importTreatmentsToInvoiceDraft = () => {
    const suggestions = getTreatmentLineSuggestions(patientId);
    if (suggestions.length === 0) {
      Alert.alert(el.common.error, el.invoices.importTreatmentsEmpty);
      return;
    }
    setInvoiceLineDrafts(draftsFromSuggestions(suggestions));
  };

  const openReceiptModal = () => {
    const suggestions = getTreatmentLineSuggestions(patientId);
    setReceiptLineDrafts(
      suggestions.length > 0
        ? draftsFromSuggestions(suggestions)
        : [
            {
              ...createEmptyLineDraft(),
              description: el.receipts.defaultService,
            },
          ],
    );
    setPayMethod(PAYMENT_METHODS.CASH);
    setReceiptModal(true);
  };

  const importTreatmentsToReceiptDraft = () => {
    const suggestions = getTreatmentLineSuggestions(patientId);
    if (suggestions.length === 0) {
      Alert.alert(el.common.error, el.receipts.importTreatmentsEmpty);
      return;
    }
    setReceiptLineDrafts(draftsFromSuggestions(suggestions));
  };

  const saveInvoice = () => {
    const lines = parseInvoiceLineDrafts(invoiceLineDrafts);
    if (!lines) {
      Alert.alert(el.appointments.validationErrorTitle, el.invoices.validation);
      return;
    }
    setSaving(true);
    try {
      createInvoice({
        patientId,
        lines,
        status: 'issued',
        createdBy: user?.id ?? null,
      });
      setInvoiceModal(false);
      void load();
      Alert.alert(el.common.success, el.invoices.invoiceCreated);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.invoices.invoiceCreateFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const onShareInvoicePdf = async (invoiceId: string) => {
    try {
      setBusyId(invoiceId);
      await shareInvoicePdf(invoiceId);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.invoices.pdfFailed,
      );
    } finally {
      setBusyId(null);
    }
  };

  const onShareReceiptPdf = async (receiptId: string) => {
    try {
      setBusyId(receiptId);
      await shareReceiptPdf(receiptId);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.receipts.pdfFailed,
      );
    } finally {
      setBusyId(null);
    }
  };

  const saveReceipt = () => {
    const lines = parseReceiptLineDrafts(receiptLineDrafts);
    if (!lines) {
      Alert.alert(el.appointments.validationErrorTitle, el.receipts.validation);
      return;
    }
    setSaving(true);
    try {
      createReceipt({
        patientId,
        lines,
        paymentMethod: payMethod,
        vatRate: defaultVatRate,
        recordPayment: true,
        createdBy: user?.id ?? null,
      });
      setReceiptModal(false);
      void load();
      Alert.alert(el.common.success, el.invoices.receiptCreated);
    } catch (e) {
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.invoices.receiptCreateFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const issueReceiptFromInvoice = async (invoiceId: string) => {
    try {
      setBusyId(invoiceId);
      createReceiptForInvoice(invoiceId, {createdBy: user?.id ?? null});
      await load();
      Alert.alert(el.common.success, el.invoices.receiptFromInvoiceSuccess);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      Alert.alert(
        el.common.error,
        msg.includes('already has a receipt')
          ? el.invoices.invoiceAlreadyHasReceipt
          : el.invoices.receiptFromInvoiceFailed,
      );
    } finally {
      setBusyId(null);
    }
  };

  const openPayInvoiceModal = (inv: InvoiceRow) => {
    const link = invoiceLinks[inv.id] ?? getInvoiceFinancialLink(inv.id);
    const balance = link?.balance ?? inv.totalAmount;
    setPayModalInvoice(inv);
    setInvoicePayAmount(balance > 0 ? String(Math.round(balance * 100) / 100) : '');
    setPayMethod(PAYMENT_METHODS.CASH);
  };

  const closePayInvoiceModal = () => {
    setPayModalInvoice(null);
    setInvoicePayAmount('');
  };

  const submitInvoicePayment = async () => {
    if (!payModalInvoice) {
      return;
    }
    const amount = Number.parseFloat(invoicePayAmount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(el.common.error, el.invoices.partialPaymentInvalid);
      return;
    }
    const link = getInvoiceFinancialLink(payModalInvoice.id);
    const balance = link?.balance ?? payModalInvoice.totalAmount;
    if (amount > balance + 0.01) {
      Alert.alert(el.common.error, el.invoices.partialPaymentExceeds);
      return;
    }
    try {
      setSaving(true);
      recordPaymentForInvoice(payModalInvoice.id, amount, payMethod);
      const invId = payModalInvoice.id;
      closePayInvoiceModal();
      await load();
      const updated = getInvoiceFinancialLink(invId);
      if (updated?.canIssueReceipt) {
        Alert.alert(el.invoices.paid, el.invoices.paidLinked, [
          {text: el.invoices.issueReceiptLater, style: 'cancel'},
          {
            text: el.invoices.issueReceiptYes,
            onPress: () => void issueReceiptFromInvoice(invId),
          },
        ]);
      } else {
        Alert.alert(el.invoices.paid, el.invoices.paidLinked);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      Alert.alert(
        el.common.error,
        msg === 'AMOUNT_EXCEEDS_BALANCE'
          ? el.invoices.partialPaymentExceeds
          : msg === 'INVALID_AMOUNT'
            ? el.invoices.partialPaymentInvalid
            : el.invoices.paymentRecordFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const onCancelInvoice = (inv: InvoiceRow) => {
    Alert.alert(
      el.invoices.cancelInvoice,
      `${el.invoices.cancelConfirm} ${inv.invoiceNumber};`,
      [
      {text: el.invoices.cancelInvoiceNo, style: 'cancel'},
      {
        text: el.invoices.cancelInvoice,
        style: 'destructive',
        onPress: () => {
          updateInvoiceStatus(inv.id, 'cancelled');
          void load();
        },
      },
    ]);
  };

  const onMyDataReceipt = async (receiptId: string) => {
    if (!afmOk) {
      return;
    }
    try {
      setBusyId(receiptId);
      const mark = await submitReceiptToMyData(receiptId);
      Alert.alert('myDATA', `${el.invoices.mydataSubmitted} ${mark}`);
      void load();
    } catch (e) {
      Alert.alert(el.common.error, e instanceof Error ? e.message : el.invoices.submitFailed);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <ScreenSafeArea variant="content">
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#2563eb" />
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
          {patientName || el.common.patient} {el.invoices.headerSuffix}
        </Text>
        <Text className="mt-1 text-sm text-slate-600">{el.invoices.intro}</Text>

        {!afmOk ? (
          <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <MaterialIcons name="info-outline" size={22} color="#b45309" />
            <Text className="flex-1 text-sm text-amber-900">
              {el.invoices.afmMissing}
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row rounded-xl border border-slate-200 bg-white p-1">
          {(['invoices', 'receipts'] as TabKey[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={`flex-1 rounded-lg py-2.5 ${
                tab === key ? 'bg-slate-900' : 'bg-transparent'
              }`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  tab === key ? 'text-white' : 'text-slate-600'
                }`}>
                {key === 'invoices' ? el.invoices.tabInvoices : el.invoices.tabReceipts}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={tab === 'invoices' ? openInvoiceModal : openReceiptModal}
          className="mt-4 flex-row items-center justify-center rounded-xl bg-slate-900 py-3.5 active:bg-slate-800">
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text className="ml-1 text-base font-semibold text-white">
            {tab === 'invoices' ? el.invoices.newInvoice : el.invoices.newReceipt}
          </Text>
        </Pressable>

        {tab === 'invoices' ? (
          invoices.length === 0 ? (
            <EmptyState kind="invoice" />
          ) : (
            <View className="mt-4 gap-3">
              {invoices.map((inv) => (
                <View
                  key={inv.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text className="font-mono text-sm font-semibold text-slate-900">
                        {inv.invoiceNumber}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500">
                        {formatWhen(inv.issueDate)} · VAT {inv.vatRate}%
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-2.5 py-1 ${STATUS_COLOR[inv.status]}`}>
                      <Text className="text-xs font-semibold">
                        {invoiceStatusLabel(inv.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-lg font-bold text-slate-900">
                    {formatCurrencyEur(inv.totalAmount)}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {el.invoices.netLabel} {formatCurrencyEur(inv.subtotal)} + {el.invoices.vatLabel}{' '}
                    {formatCurrencyEur(inv.vatAmount)}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    {getInvoiceLines(inv.id).length} {el.invoices.linesCount}
                  </Text>
                  {invoiceLinks[inv.id] &&
                  invoiceLinks[inv.id]!.totalPaid > 0 &&
                  inv.status !== 'cancelled' ? (
                    <Text className="mt-1 text-xs text-slate-600">
                      {el.invoices.paidAmount
                        .replace('{paid}', formatCurrencyEur(invoiceLinks[inv.id]!.totalPaid))
                        .replace('{total}', formatCurrencyEur(inv.totalAmount))}
                    </Text>
                  ) : null}
                  {invoiceLinks[inv.id] &&
                  invoiceLinks[inv.id]!.balance > 0.01 &&
                  inv.status === 'issued' ? (
                    <Text className="mt-0.5 text-xs font-medium text-amber-800">
                      {el.invoices.balanceRemaining.replace(
                        '{amount}',
                        formatCurrencyEur(invoiceLinks[inv.id]!.balance),
                      )}
                    </Text>
                  ) : null}
                  {invoiceLinks[inv.id]?.receipt ? (
                    <Text className="mt-1 text-xs font-medium text-emerald-700">
                      {el.invoices.linkedReceipt.replace(
                        '{number}',
                        invoiceLinks[inv.id]!.receipt!.receiptNumber,
                      )}
                    </Text>
                  ) : null}
                  <Pressable
                    disabled={busyId === inv.id}
                    onPress={() => void onShareInvoicePdf(inv.id)}
                    className="mt-3 flex-row items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-2.5 disabled:opacity-50">
                    {busyId === inv.id ? (
                      <ActivityIndicator size="small" color="#0f172a" />
                    ) : (
                      <>
                        <MaterialIcons name="picture-as-pdf" size={18} color="#0f172a" />
                        <Text className="ml-2 text-sm font-semibold text-slate-800">
                          {el.invoices.sharePdf}
                        </Text>
                      </>
                    )}
                  </Pressable>
                  {inv.status === 'issued' ? (
                    <View className="mt-2 flex-row gap-2">
                      <Pressable
                        onPress={() => openPayInvoiceModal(inv)}
                        className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2">
                        <Text className="text-center text-sm font-semibold text-emerald-800">
                          {el.invoices.recordPayment}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onCancelInvoice(inv)}
                        className="rounded-lg border border-slate-200 px-3 py-2">
                        <Text className="text-sm font-semibold text-slate-600">
                          {el.common.cancel}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                  {invoiceLinks[inv.id]?.canIssueReceipt ? (
                    <Pressable
                      disabled={busyId === inv.id}
                      onPress={() => void issueReceiptFromInvoice(inv.id)}
                      className="mt-2 flex-row items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 disabled:opacity-50">
                      {busyId === inv.id ? (
                        <ActivityIndicator size="small" color="#4f46e5" />
                      ) : (
                        <>
                          <MaterialIcons name="receipt-long" size={18} color="#4f46e5" />
                          <Text className="ml-2 text-sm font-semibold text-indigo-800">
                            {el.invoices.issueReceiptFromInvoice}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )
        ) : receipts.length === 0 ? (
          <EmptyState kind="receipt" />
        ) : (
          <View className="mt-4 gap-3">
            {receipts.map((rec) => (
              <View
                key={rec.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Text className="font-mono text-sm font-semibold text-slate-900">
                  {rec.receiptNumber}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {formatWhen(rec.issueDate)} · {paymentMethodLabel(rec.paymentMethod)}
                </Text>
                <Text className="mt-2 text-lg font-bold text-slate-900">
                  {formatCurrencyEur(rec.totalAmount)}
                </Text>
                <Text className="text-xs text-slate-500">
                  {el.invoices.netLabel} {formatCurrencyEur(rec.subtotal)} + {el.invoices.vatLabel}{' '}
                  {formatCurrencyEur(rec.vatAmount)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {getReceiptLines(rec.id).length} {el.receipts.linesCount}
                </Text>
                {rec.invoiceId ? (
                  <Text className="mt-1 text-xs font-medium text-blue-700">
                    {el.invoices.linkedInvoice.replace(
                      '{number}',
                      getInvoiceById(rec.invoiceId)?.invoiceNumber ?? '—',
                    )}
                  </Text>
                ) : null}
                <Pressable
                  disabled={busyId === rec.id}
                  onPress={() => void onShareReceiptPdf(rec.id)}
                  className="mt-3 flex-row items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-2.5 disabled:opacity-50">
                  {busyId === rec.id ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <>
                      <MaterialIcons name="picture-as-pdf" size={18} color="#0f172a" />
                      <Text className="ml-2 text-sm font-semibold text-slate-800">
                        {el.receipts.sharePdf}
                      </Text>
                    </>
                  )}
                </Pressable>
                {rec.mydataMark ? (
                  <View className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Text className="text-xs font-semibold text-emerald-800">myDATA</Text>
                    <Text className="text-sm text-emerald-900" selectable>
                      {rec.mydataMark}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    disabled={!afmOk || busyId === rec.id}
                    onPress={() => void onMyDataReceipt(rec.id)}
                    className="mt-3 flex-row items-center justify-center rounded-lg border border-blue-200 bg-blue-50 py-2.5 disabled:opacity-50">
                    {busyId === rec.id ? (
                      <ActivityIndicator size="small" color="#1d4ed8" />
                    ) : (
                      <>
                        <MaterialIcons name="cloud-upload" size={18} color="#1d4ed8" />
                        <Text className="ml-2 text-sm font-semibold text-blue-800">
                          {el.invoices.submitMydata}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={invoiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setInvoiceModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              className="p-5 pb-4"
              contentContainerStyle={{paddingBottom: 8}}>
              <Text className="text-lg font-bold text-slate-900">
                {el.invoices.newInvoiceTitle}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{el.invoices.vatHint}</Text>
              <View className="mt-4">
                <InvoiceLinesEditor
                  lines={invoiceLineDrafts}
                  onChange={setInvoiceLineDrafts}
                  onImportTreatments={importTreatmentsToInvoiceDraft}
                />
              </View>
            </ScrollView>
            <View className="flex-row gap-2 border-t border-slate-100 p-5">
              <Pressable
                onPress={() => setInvoiceModal(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 py-3">
                <Text className="text-center font-semibold text-slate-700">
                  {el.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={saveInvoice}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 py-3 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    {el.common.save}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={receiptModal}
        animationType="slide"
        transparent
        onRequestClose={() => setReceiptModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              className="p-5 pb-4"
              contentContainerStyle={{paddingBottom: 8}}>
              <Text className="text-lg font-bold text-slate-900">
                {el.receipts.newReceiptTitle}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{el.invoices.vatHint}</Text>
              <Text className="mt-1 text-sm text-slate-600">{el.receipts.paymentHint}</Text>

              <Text className="mt-4 text-sm font-medium text-slate-700">
                {el.clinic.method}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {Object.values(PAYMENT_METHODS).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setPayMethod(m)}
                    className={`rounded-lg border px-3 py-2 ${
                      payMethod === m
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                    <Text
                      className={`text-sm font-medium ${
                        payMethod === m ? 'text-white' : 'text-slate-700'
                      }`}>
                      {paymentMethodLabel(m)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="mt-4">
                <InvoiceLinesEditor
                  variant="receipt"
                  lines={receiptLineDrafts}
                  onChange={setReceiptLineDrafts}
                  onImportTreatments={importTreatmentsToReceiptDraft}
                  vatRate={defaultVatRate}
                />
              </View>
            </ScrollView>
            <View className="flex-row gap-2 border-t border-slate-100 p-5">
              <Pressable
                onPress={() => setReceiptModal(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 py-3">
                <Text className="text-center font-semibold text-slate-700">
                  {el.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={saveReceipt}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-900 py-3 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    {el.common.save}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={payModalInvoice != null}
        animationType="slide"
        transparent
        onRequestClose={closePayInvoiceModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white p-5 pb-6">
            <Text className="text-lg font-bold text-slate-900">
              {el.invoices.partialPaymentTitle}
            </Text>
            {payModalInvoice ? (
              <Text className="mt-1 font-mono text-sm text-slate-600">
                {payModalInvoice.invoiceNumber}
              </Text>
            ) : null}
            {payModalInvoice && invoiceLinks[payModalInvoice.id] ? (
              <Text className="mt-2 text-sm text-amber-800">
                {el.invoices.partialPaymentBalance.replace(
                  '{amount}',
                  formatCurrencyEur(invoiceLinks[payModalInvoice.id]!.balance),
                )}
              </Text>
            ) : null}
            <Text className="mt-4 text-sm font-medium text-slate-700">
              {el.invoices.partialPaymentAmount}
            </Text>
            <TextInput
              className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
              keyboardType="decimal-pad"
              value={invoicePayAmount}
              onChangeText={setInvoicePayAmount}
            />
            {payModalInvoice && invoiceLinks[payModalInvoice.id] ? (
              <Pressable
                onPress={() =>
                  setInvoicePayAmount(
                    String(
                      Math.round(invoiceLinks[payModalInvoice!.id]!.balance * 100) / 100,
                    ),
                  )
                }
                className="mt-2 self-start rounded-lg bg-slate-100 px-3 py-1.5">
                <Text className="text-xs font-semibold text-slate-700">
                  {el.invoices.partialPaymentPayFull}
                </Text>
              </Pressable>
            ) : null}
            <Text className="mt-4 text-sm font-medium text-slate-700">
              {el.clinic.method}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {Object.values(PAYMENT_METHODS).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setPayMethod(m)}
                  className={`rounded-lg border px-3 py-2 ${
                    payMethod === m
                      ? 'border-slate-900 bg-slate-900'
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                  <Text
                    className={`text-sm font-medium ${
                      payMethod === m ? 'text-white' : 'text-slate-700'
                    }`}>
                    {paymentMethodLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={closePayInvoiceModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 py-3">
                <Text className="text-center font-semibold text-slate-700">
                  {el.common.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void submitInvoicePayment()}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 py-3 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    {el.invoices.record}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenSafeArea>
  );
};

function EmptyState({kind}: {kind: 'invoice' | 'receipt'}) {
  return (
    <View className="mt-8 items-center rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4">
      <MaterialIcons
        name={kind === 'invoice' ? 'description' : 'receipt-long'}
        size={44}
        color="#94a3b8"
      />
      <Text className="mt-3 text-center text-slate-600">
        {kind === 'invoice' ? el.invoices.emptyInvoices : el.invoices.emptyReceipts}
      </Text>
    </View>
  );
}

export default PatientInvoicesScreen;
