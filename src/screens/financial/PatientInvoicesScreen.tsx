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
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {getPatientById} from '../../services/patient';
import {
  createInvoice,
  getPatientInvoices,
  getTreatmentLineSuggestions,
  recordPaymentForInvoice,
  updateInvoiceStatus,
  type InvoiceRow,
  type InvoiceStatus,
} from '../../services/financial/invoice.service';
import {
  createReceipt,
  getPatientReceipts,
  type ReceiptRow,
} from '../../services/financial/receipt.service';
import {PAYMENT_METHODS} from '../../services/financial/payment.service';
import {submitReceiptToMyData} from '../../services/financial/mydata.service';
import {useAuthStore} from '../../store/auth.store';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';

type TabKey = 'invoices' | 'receipts';

const currencyEl = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const formatWhen = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'}).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  paid: 'Paid',
  cancelled: 'Cancelled',
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
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [invoiceModal, setInvoiceModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [lineDesc, setLineDesc] = useState('Dental services');
  const [lineAmount, setLineAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS.CASH);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const patient = await getPatientById(patientId);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
        setAfmOk(/^\d{9}$/.test((patient.afm ?? '').trim()));
      }
      setInvoices(getPatientInvoices(patientId));
      setReceipts(getPatientReceipts(patientId));
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

  const parseAmount = (raw: string): number | null => {
    const n = Number.parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const openInvoiceModal = () => {
    const suggestions = getTreatmentLineSuggestions(patientId);
    if (suggestions.length > 0) {
      setLineDesc(suggestions[0].description);
      setLineAmount(String(suggestions[0].unitPrice));
    } else {
      setLineDesc('Dental services');
      setLineAmount('');
    }
    setInvoiceModal(true);
  };

  const saveInvoice = () => {
    const amt = parseAmount(lineAmount);
    if (!lineDesc.trim() || amt == null) {
      Alert.alert('Validation', 'Enter description and a valid amount.');
      return;
    }
    setSaving(true);
    try {
      createInvoice({
        patientId,
        lines: [{description: lineDesc.trim(), quantity: 1, unitPrice: amt}],
        status: 'issued',
        createdBy: user?.id ?? null,
      });
      setInvoiceModal(false);
      void load();
      Alert.alert('Invoice created', 'The invoice has been saved.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const saveReceipt = () => {
    const amt = parseAmount(lineAmount);
    if (!lineDesc.trim() || amt == null) {
      Alert.alert('Validation', 'Enter description and a valid amount.');
      return;
    }
    setSaving(true);
    try {
      createReceipt({
        patientId,
        lines: [{description: lineDesc.trim(), quantity: 1, unitPrice: amt}],
        paymentMethod: payMethod,
        recordPayment: true,
        createdBy: user?.id ?? null,
      });
      setReceiptModal(false);
      void load();
      Alert.alert('Receipt created', 'Receipt and payment have been recorded.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create receipt.');
    } finally {
      setSaving(false);
    }
  };

  const onPayInvoice = (inv: InvoiceRow) => {
    Alert.alert(
      'Record payment',
      `Record full payment of ${currencyEl(inv.totalAmount)} for ${inv.invoiceNumber}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Record',
          onPress: () => {
            try {
              recordPaymentForInvoice(
                inv.id,
                inv.totalAmount,
                PAYMENT_METHODS.CASH,
              );
              void load();
              Alert.alert('Paid', 'Payment linked to invoice.');
            } catch (e) {
              Alert.alert(
                'Error',
                e instanceof Error ? e.message : 'Could not record payment.',
              );
            }
          },
        },
      ],
    );
  };

  const onCancelInvoice = (inv: InvoiceRow) => {
    Alert.alert('Cancel invoice', `Cancel ${inv.invoiceNumber}?`, [
      {text: 'No', style: 'cancel'},
      {
        text: 'Cancel invoice',
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
      Alert.alert('myDATA', `Submitted (simulation). Mark: ${mark}`);
      void load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Submission failed.');
    } finally {
      setBusyId(null);
    }
  };

  const renderFormModal = (
    visible: boolean,
    title: string,
    onClose: () => void,
    onSave: () => void,
  ) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-2xl bg-white p-5 pb-8">
          <Text className="text-lg font-bold text-slate-900">{title}</Text>
          <Text className="mt-1 text-sm text-slate-600">
            VAT 24% is calculated automatically on the net amount.
          </Text>

          <Text className="mt-4 text-sm font-medium text-slate-700">Description</Text>
          <TextInput
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-900"
            value={lineDesc}
            onChangeText={setLineDesc}
            placeholder="Service description"
          />

          <Text className="mt-3 text-sm font-medium text-slate-700">Net amount (EUR)</Text>
          <TextInput
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2.5 text-base text-slate-900"
            value={lineAmount}
            onChangeText={setLineAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {title.includes('Receipt') ? (
            <>
              <Text className="mt-3 text-sm font-medium text-slate-700">Payment method</Text>
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
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <View className="mt-6 flex-row gap-2">
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 py-3">
              <Text className="text-center font-semibold text-slate-700">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-slate-900 py-3 disabled:opacity-50">
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          {patientName || 'Patient'} — Invoices & receipts
        </Text>
        <Text className="mt-1 text-sm text-slate-600">
          Τιμολόγια (B2B) και αποδείξεις (retail). Numbers are sequential per year.
        </Text>

        {!afmOk ? (
          <View className="mt-4 flex-row gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <MaterialIcons name="info-outline" size={22} color="#b45309" />
            <Text className="flex-1 text-sm text-amber-900">
              Patient AFM missing — myDATA submission will stay disabled until AFM is set on
              the profile.
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
                {key === 'invoices' ? 'Invoices' : 'Receipts'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={tab === 'invoices' ? openInvoiceModal : () => setReceiptModal(true)}
          className="mt-4 flex-row items-center justify-center rounded-xl bg-slate-900 py-3.5 active:bg-slate-800">
          <MaterialIcons name="add" size={22} color="#fff" />
          <Text className="ml-1 text-base font-semibold text-white">
            {tab === 'invoices' ? 'New invoice' : 'New receipt'}
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
                        {STATUS_LABEL[inv.status]}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-lg font-bold text-slate-900">
                    {currencyEl(inv.totalAmount)}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Net {currencyEl(inv.subtotal)} + VAT {currencyEl(inv.vatAmount)}
                  </Text>
                  {inv.status === 'issued' ? (
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        onPress={() => onPayInvoice(inv)}
                        className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2">
                        <Text className="text-center text-sm font-semibold text-emerald-800">
                          Record payment
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onCancelInvoice(inv)}
                        className="rounded-lg border border-slate-200 px-3 py-2">
                        <Text className="text-sm font-semibold text-slate-600">Cancel</Text>
                      </Pressable>
                    </View>
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
                  {formatWhen(rec.issueDate)} · {rec.paymentMethod}
                </Text>
                <Text className="mt-2 text-lg font-bold text-slate-900">
                  {currencyEl(rec.totalAmount)}
                </Text>
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
                          Submit to myDATA
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

      {renderFormModal(
        invoiceModal,
        'New invoice (Τιμολόγιο)',
        () => setInvoiceModal(false),
        saveInvoice,
      )}
      {renderFormModal(
        receiptModal,
        'New receipt (Απόδειξη)',
        () => setReceiptModal(false),
        saveReceipt,
      )}
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
        No {kind === 'invoice' ? 'invoices' : 'receipts'} yet.
      </Text>
    </View>
  );
}

export default PatientInvoicesScreen;
