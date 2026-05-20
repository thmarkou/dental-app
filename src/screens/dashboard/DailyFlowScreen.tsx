/**
 * Daily clinic flow board for secretary / assistant (Module E).
 */

import React, {useCallback, useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {MaterialIcons} from '@expo/vector-icons';
import type {DashboardStackParamList} from '../../navigation/navigation.types';
import type {AppointmentWithPatient} from '../../types/appointment';
import {
  getAppointmentsByDateWithPatient,
  getCompletedTodayPendingPayment,
  updateAppointmentStatus,
  startTreatmentAppointment,
  checkOutAppointment,
} from '../../services/appointment';
import {isDatabaseAvailable} from '../../services/database';
import {DatabaseWarning} from '../../components/common/DatabaseWarning';
import BalanceBadge from '../../components/financial/BalanceBadge';
import {
  getPatientBalance,
  recordPayment,
  PAYMENT_METHODS,
} from '../../services/financial/payment.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {
  el,
  paymentMethodLabel,
  appointmentTypeLabel,
  appointmentStatusLabel,
  UI_LOCALE,
} from '../../i18n';

type Nav = NativeStackNavigationProp<DashboardStackParamList, 'DailyFlow'>;

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat(UI_LOCALE, {hour: '2-digit', minute: '2-digit'}).format(d);

const currencyEl = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);

const FlowColumn: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isWide: boolean;
}> = ({title, subtitle, children, isWide}) => (
  <View
    className={`${isWide ? 'min-w-[260px] flex-1' : 'w-full'} border-slate-200 px-2 py-2 ${
      isWide ? 'border-r' : 'border-b'
    }`}>
    <Text className="text-center text-sm font-bold text-slate-800">{title}</Text>
    {subtitle ? (
      <Text className="mb-2 text-center text-xs text-slate-500">{subtitle}</Text>
    ) : (
      <View className="mb-2" />
    )}
    {children}
  </View>
);

const AppointmentFlowCard: React.FC<{
  item: AppointmentWithPatient;
  onConfirm?: () => void;
  onCheckIn: () => void;
  onStart: () => void;
  onComplete: () => void;
}> = ({item, onConfirm, onCheckIn, onStart, onComplete}) => {
  const showConfirm = item.status === 'scheduled' && onConfirm != null;
  const showCheckIn = item.status === 'confirmed';
  const showCheckInFromScheduled =
    item.status === 'scheduled' && onConfirm != null;
  const showStart = item.status === 'checked_in';
  const showComplete = item.status === 'in_progress';

  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Text className="text-base font-semibold text-slate-900">
        {item.patientFirstName} {item.patientLastName}
      </Text>
      <Text className="text-xs text-slate-500">
        {formatTime(item.startTime)} · {appointmentTypeLabel(item.type)}
      </Text>
      <Text className="mt-1 text-xs font-medium text-slate-600">
        {appointmentStatusLabel(item.status)}
      </Text>
      <View className="mt-2">
        <BalanceBadge patientId={item.patientId} />
      </View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {showConfirm && (
          <Pressable
            onPress={onConfirm}
            className="rounded-lg bg-slate-700 px-3 py-2 active:bg-slate-800">
            <Text className="text-xs font-semibold text-white">
              {el.clinic.confirmAppointment}
            </Text>
          </Pressable>
        )}
        {showCheckIn && (
          <Pressable
            onPress={onCheckIn}
            className="rounded-lg bg-blue-600 px-3 py-2 active:bg-blue-700">
            <Text className="text-xs font-semibold text-white">{el.clinic.checkIn}</Text>
          </Pressable>
        )}
        {showCheckInFromScheduled && (
          <Pressable
            onPress={onCheckIn}
            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 active:bg-blue-100">
            <Text className="text-xs font-semibold text-blue-800">{el.clinic.checkIn}</Text>
          </Pressable>
        )}
        {showStart && (
          <Pressable
            onPress={onStart}
            className="rounded-lg bg-amber-500 px-3 py-2 active:bg-amber-600">
            <Text className="text-xs font-semibold text-white">{el.clinic.startTreatment}</Text>
          </Pressable>
        )}
        {showComplete && (
          <Pressable
            onPress={onComplete}
            className="rounded-lg bg-emerald-600 px-3 py-2 active:bg-emerald-700">
            <Text className="text-xs font-semibold text-white">{el.clinic.complete}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const PendingPaymentCard: React.FC<{
  name: string;
  balance: number;
  onQuickPay: () => void;
}> = ({name, balance, onQuickPay}) => (
  <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
    <Text className="font-semibold text-slate-900">{name}</Text>
    <Text className="text-sm text-amber-900">
      {el.clinic.due}: {currencyEl(balance)}
    </Text>
    <Pressable
      onPress={onQuickPay}
      className="mt-2 self-start rounded-lg bg-amber-600 px-3 py-2 active:bg-amber-700">
      <Text className="text-xs font-semibold text-white">{el.clinic.quickPayment}</Text>
    </Pressable>
  </View>
);

const DailyFlowScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {width} = useWindowDimensions();
  const isWide = width >= 840;
  const today = new Date();

  const [refreshing, setRefreshing] = useState(false);
  const [scheduled, setScheduled] = useState<AppointmentWithPatient[]>([]);
  const [waiting, setWaiting] = useState<AppointmentWithPatient[]>([]);
  const [inChair, setInChair] = useState<AppointmentWithPatient[]>([]);
  const [pendingPay, setPendingPay] = useState<
    Awaited<ReturnType<typeof getCompletedTodayPendingPayment>>
  >([]);

  const [payModal, setPayModal] = useState<{
    patientId: string;
    patientName: string;
    balance: number;
  } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHODS.CASH);
  const [payNotes, setPayNotes] = useState('');
  const [payReceipt, setPayReceipt] = useState(false);
  const [paySaving, setPaySaving] = useState(false);

  const load = useCallback(async () => {
    if (!isDatabaseAvailable) {
      return;
    }
    const day = new Date();
    const all = await getAppointmentsByDateWithPatient(day);
    const sched = all.filter((a) => a.status === 'scheduled');
    const w = all.filter(
      (a) => a.status === 'confirmed' || a.status === 'checked_in',
    );
    const chair = all.filter((a) => a.status === 'in_progress');
    const pending = await getCompletedTodayPendingPayment(day);
    setScheduled(sched);
    setWaiting(w);
    setInChair(chair);
    setPendingPay(pending);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Overview')}
          className="mr-2 flex-row items-center gap-1 rounded-lg px-2 py-1 active:bg-slate-100">
          <MaterialIcons name="insights" size={20} color="#2563eb" />
          <Text className="text-sm font-medium text-blue-600">{el.clinic.overviewLink}</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const openQuickPay = (patientId: string, patientName: string, balance: number) => {
    setPayModal({patientId, patientName, balance});
    setPayAmount(balance.toFixed(2).replace('.', ','));
    setPayMethod(PAYMENT_METHODS.CASH);
    setPayNotes('');
    setPayReceipt(false);
  };

  const closePay = () => {
    setPayModal(null);
  };

  const submitPayment = () => {
    if (!payModal) {
      return;
    }
    const normalized = payAmount.replace(',', '.');
    const amt = Number.parseFloat(normalized);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(el.clinic.amountTitle, el.clinic.invalidAmount);
      return;
    }
    setPaySaving(true);
    try {
      recordPayment({
        patientId: payModal.patientId,
        amount: amt,
        paymentMethod: payMethod,
        notes: payNotes.trim() || null,
        receiptIssued: payReceipt,
      });
      closePay();
      void load();
      Alert.alert(el.clinic.paymentRecordedTitle, el.clinic.paymentRecorded);
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.clinic.paymentFailed);
    } finally {
      setPaySaving(false);
    }
  };

  const handleComplete = async (apt: AppointmentWithPatient) => {
    try {
      await checkOutAppointment(apt.id);
      const bal = getPatientBalance(apt.patientId);
      await load();
      if (bal > 0.005) {
        openQuickPay(apt.patientId, `${apt.patientFirstName} ${apt.patientLastName}`, bal);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(el.common.error, el.clinic.completeFailed);
    }
  };

  return (
    <ScreenSafeArea variant="content">
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {!isDatabaseAvailable && <DatabaseWarning />}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        contentContainerStyle={{paddingBottom: 32, paddingHorizontal: isWide ? 12 : 8}}>
        <Text className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          {new Intl.DateTimeFormat(UI_LOCALE, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(today)}
        </Text>

        <View
          className={isWide ? 'min-h-[480px] flex-1 flex-row items-start' : 'flex-col'}>
          <FlowColumn
            title={el.clinic.scheduledColumn}
            subtitle={el.clinic.scheduledSubtitle}
            isWide={isWide}>
            {scheduled.length === 0 ? (
              <Text className="py-4 text-center text-sm text-slate-400">
                {el.clinic.noPatientsHere}
              </Text>
            ) : (
              scheduled.map((item) => (
                <AppointmentFlowCard
                  key={item.id}
                  item={item}
                  onConfirm={() =>
                    void updateAppointmentStatus(item.id, 'confirmed')
                      .then(() => load())
                      .catch(() =>
                        Alert.alert(el.common.error, el.clinic.confirmFailed),
                      )
                  }
                  onCheckIn={() =>
                    void updateAppointmentStatus(item.id, 'checked_in', {
                      recordCheckIn: true,
                    })
                      .then(() => load())
                      .catch(() => Alert.alert(el.common.error, el.clinic.checkInFailed))
                  }
                  onStart={() => {}}
                  onComplete={() => {}}
                />
              ))
            )}
          </FlowColumn>

          <FlowColumn
            title={el.clinic.waitingRoom}
            subtitle={el.clinic.waitingSubtitle}
            isWide={isWide}>
            {waiting.length === 0 ? (
              <Text className="py-4 text-center text-sm text-slate-400">
                {el.clinic.noPatientsHere}
              </Text>
            ) : (
              waiting.map((item) => (
                <AppointmentFlowCard
                  key={item.id}
                  item={item}
                  onCheckIn={() =>
                    void updateAppointmentStatus(item.id, 'checked_in', {
                      recordCheckIn: true,
                    })
                      .then(() => load())
                      .catch(() => Alert.alert(el.common.error, el.clinic.checkInFailed))
                  }
                  onStart={() =>
                    void startTreatmentAppointment(item.id)
                      .then(() => load())
                      .catch(() => Alert.alert(el.common.error, el.clinic.startFailed))
                  }
                  onComplete={() => void handleComplete(item)}
                />
              ))
            )}
          </FlowColumn>

          <FlowColumn
            title={el.clinic.inChair}
            subtitle={el.clinic.inChairSubtitle}
            isWide={isWide}>
            {inChair.length === 0 ? (
              <Text className="py-4 text-center text-sm text-slate-400">
                {el.clinic.emptyChair}
              </Text>
            ) : (
              inChair.map((item) => (
                <AppointmentFlowCard
                  key={item.id}
                  item={item}
                  onCheckIn={() => {}}
                  onStart={() => {}}
                  onComplete={() => void handleComplete(item)}
                />
              ))
            )}
          </FlowColumn>

          <FlowColumn
            title={el.clinic.checkout}
            subtitle={el.clinic.checkoutSubtitle}
            isWide={isWide}>
            {pendingPay.length === 0 ? (
              <Text className="py-4 text-center text-sm text-slate-400">
                {el.clinic.allClear}
              </Text>
            ) : (
              pendingPay.map((row) => (
                <PendingPaymentCard
                  key={row.appointment.id}
                  name={`${row.appointment.patientFirstName} ${row.appointment.patientLastName}`}
                  balance={row.balance}
                  onQuickPay={() =>
                    openQuickPay(
                      row.appointment.patientId,
                      `${row.appointment.patientFirstName} ${row.appointment.patientLastName}`,
                      row.balance,
                    )
                  }
                />
              ))
            )}
          </FlowColumn>
        </View>
      </ScrollView>

      <Modal visible={payModal != null} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={closePay}>
          <Pressable
            className="rounded-t-2xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-slate-900">{el.clinic.quickPayment}</Text>
            {payModal ? (
              <Text className="mt-1 text-sm text-slate-600">{payModal.patientName}</Text>
            ) : null}
            {payModal ? (
              <Text className="text-sm text-amber-800">
                {el.clinic.balance}: {currencyEl(payModal.balance)}
              </Text>
            ) : null}

            <Text className="mb-1 mt-4 text-xs font-medium text-slate-600">
              {el.common.amount}
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <Text className="mb-1 text-xs font-medium text-slate-600">{el.clinic.method}</Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {[PAYMENT_METHODS.CASH, PAYMENT_METHODS.CARD, PAYMENT_METHODS.BANK_TRANSFER].map(
                (m) => (
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
                ),
              )}
            </View>

            <Pressable
              onPress={() => setPayReceipt(!payReceipt)}
              className="mb-3 flex-row items-center gap-2">
              <MaterialIcons
                name={payReceipt ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color="#2563eb"
              />
              <Text className="text-sm text-slate-700">{el.clinic.receiptIssued}</Text>
            </Pressable>

            <Text className="mb-1 text-xs text-slate-600">{el.common.notes}</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={payNotes}
              onChangeText={setPayNotes}
              placeholder={el.clinic.optionalNotes}
              placeholderTextColor="#94a3b8"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={closePay}
                className="flex-1 items-center rounded-xl border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">{el.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={submitPayment}
                disabled={paySaving}
                className="flex-1 items-center rounded-xl bg-blue-600 py-3 disabled:opacity-50">
                {paySaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">{el.clinic.record}</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
    </ScreenSafeArea>
  );
};

export default DailyFlowScreen;
