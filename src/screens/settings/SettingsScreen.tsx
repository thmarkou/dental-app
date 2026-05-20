/**
 * Settings — profile, system backup/export, and weekly backup reminder.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {useAuthStore} from '../../store/auth.store';
import {updateUserPassword} from '../../services/auth';
import {exportDatabase, generateExcelReport} from '../../services/system/backup.service';
import Input from '../../components/common/Input';
import {
  getBackupReminderEnabled,
  setBackupReminderEnabled,
} from '../../services/system/backupReminder.service';
import {ScreenSafeArea} from '../../components/common/ScreenSafeArea';
import {
  getPracticeSettings,
  savePracticeSettings,
  type PracticeSettings,
} from '../../services/settings/practiceSettings.service';
import {
  getPracticeReminderSettings,
  savePracticeReminderSettings,
  type PracticeReminderSettings,
  type ReminderChannel,
} from '../../services/appointment/reminderScheduler.service';
import {isSmsGatewayConfigured, sendSms} from '../../services/appointment/smsGateway.service';
import {el} from '../../i18n';

function applySettingsToForm(s: PracticeSettings) {
  return {
    legalName: s.legalName,
    tradeName: s.tradeName ?? '',
    afm: s.afm ?? '',
    doy: s.doy ?? '',
    activityCode: s.activityCode ?? '',
    addressStreet: s.addressStreet ?? '',
    addressCity: s.addressCity ?? '',
    addressPostalCode: s.addressPostalCode ?? '',
    addressCountry: s.addressCountry || el.patients.greece,
    phone: s.phone ?? '',
    email: s.email ?? '',
    website: s.website ?? '',
    defaultVatRate: String(s.defaultVatRate),
    invoiceFooter: s.invoiceFooter ?? '',
  };
}

const SettingsScreen = () => {
  const {width} = useWindowDimensions();
  const isWide = width >= 840;

  const {logout, user} = useAuthStore();
  const [backupBusy, setBackupBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [aptReminderEnabled, setAptReminderEnabled] = useState(true);
  const [aptReminderHours, setAptReminderHours] = useState(24);
  const [aptReminderPush, setAptReminderPush] = useState(true);
  const [aptReminderSms, setAptReminderSms] = useState(false);
  const [aptReminderLoading, setAptReminderLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(true);
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [practiceAfm, setPracticeAfm] = useState('');
  const [practiceDoy, setPracticeDoy] = useState('');
  const [activityCode, setActivityCode] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressCountry, setAddressCountry] = useState<string>(el.patients.greece);
  const [practicePhone, setPracticePhone] = useState('');
  const [practiceEmail, setPracticeEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [defaultVatRate, setDefaultVatRate] = useState('24');
  const [invoiceFooter, setInvoiceFooter] = useState('');

  const loadPractice = useCallback(() => {
    try {
      setPracticeLoading(true);
      const form = applySettingsToForm(getPracticeSettings());
      setLegalName(form.legalName);
      setTradeName(form.tradeName);
      setPracticeAfm(form.afm);
      setPracticeDoy(form.doy);
      setActivityCode(form.activityCode);
      setAddressStreet(form.addressStreet);
      setAddressCity(form.addressCity);
      setAddressPostalCode(form.addressPostalCode);
      setAddressCountry(form.addressCountry);
      setPracticePhone(form.phone);
      setPracticeEmail(form.email);
      setWebsite(form.website);
      setDefaultVatRate(form.defaultVatRate);
      setInvoiceFooter(form.invoiceFooter);
    } catch (e) {
      console.error(e);
    } finally {
      setPracticeLoading(false);
    }
  }, []);

  const persistAptReminders = useCallback(
    (patch: Partial<PracticeReminderSettings>) => {
      const channels: ReminderChannel[] = [];
      const push = patch.channels
        ? patch.channels.includes('local_push')
        : aptReminderPush;
      const sms = patch.channels
        ? patch.channels.includes('sms')
        : aptReminderSms;
      if (push) {
        channels.push('local_push');
      }
      if (sms) {
        channels.push('sms');
      }
      const settings: PracticeReminderSettings = {
        enabled: patch.enabled ?? aptReminderEnabled,
        hoursBefore: patch.hoursBefore ?? aptReminderHours,
        channels: patch.channels ?? (channels.length ? channels : ['local_push']),
      };
      savePracticeReminderSettings(settings);
    },
    [aptReminderEnabled, aptReminderHours, aptReminderPush, aptReminderSms],
  );

  const loadAptReminders = useCallback(() => {
    try {
      setAptReminderLoading(true);
      const s = getPracticeReminderSettings();
      setAptReminderEnabled(s.enabled);
      setAptReminderHours(s.hoursBefore);
      setAptReminderPush(s.channels.includes('local_push'));
      setAptReminderSms(s.channels.includes('sms'));
    } catch (e) {
      console.error(e);
    } finally {
      setAptReminderLoading(false);
    }
  }, []);

  const loadReminder = useCallback(async () => {
    try {
      setReminderLoading(true);
      if (Platform.OS === 'web') {
        setReminderOn(false);
        return;
      }
      const on = await getBackupReminderEnabled();
      setReminderOn(on);
    } catch (e) {
      console.error(e);
    } finally {
      setReminderLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPractice();
      loadAptReminders();
      void loadReminder();
    }, [loadPractice, loadAptReminders, loadReminder]),
  );

  const handleTestSms = () => {
    if (!isSmsGatewayConfigured()) {
      Alert.alert(el.common.error, el.settings.testSmsNoGateway);
      return;
    }
    const sendTest = async (phone: string) => {
      if (!phone.trim()) {
        return;
      }
      try {
        await sendSms(phone, 'Δοκιμή υπενθύμισης ραντεβού — Dental Practice Management');
        Alert.alert(el.common.success, el.settings.testSmsSuccess);
      } catch (e) {
        Alert.alert(
          el.common.error,
          e instanceof Error ? e.message : el.settings.reminderFailed,
        );
      }
    };
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(el.settings.testSms, el.settings.testSmsPrompt, (phone) => {
        void sendTest(phone ?? '');
      });
    } else if (practicePhone.trim()) {
      void sendTest(practicePhone);
    } else {
      Alert.alert(el.common.error, el.settings.testSmsPrompt);
    }
  };

  const handleSavePractice = () => {
    setPracticeBusy(true);
    try {
      savePracticeSettings({
        legalName,
        tradeName: tradeName.trim() || null,
        afm: practiceAfm.trim() || null,
        doy: practiceDoy.trim() || null,
        activityCode: activityCode.trim() || null,
        addressStreet: addressStreet.trim() || null,
        addressCity: addressCity.trim() || null,
        addressPostalCode: addressPostalCode.trim() || null,
        addressCountry: addressCountry.trim() || el.patients.greece,
        phone: practicePhone.trim() || null,
        email: practiceEmail.trim() || null,
        website: website.trim() || null,
        defaultVatRate: Number.parseFloat(defaultVatRate.replace(',', '.')),
        invoiceFooter: invoiceFooter.trim() || null,
      });
      Alert.alert(el.common.success, el.settings.practiceSaved);
      loadPractice();
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'INVALID_AFM') {
        Alert.alert(el.common.error, el.settings.practiceInvalidAfm);
      } else if (code === 'INVALID_VAT') {
        Alert.alert(el.common.error, el.settings.practiceInvalidVat);
      } else {
        Alert.alert(
          el.common.error,
          e instanceof Error ? e.message : el.settings.practiceSaveFailed,
        );
      }
    } finally {
      setPracticeBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(el.settings.logout, el.settings.logoutConfirm, [
      {text: el.common.cancel, style: 'cancel'},
      {
        text: el.settings.logout,
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const runBackup = async () => {
    try {
      setBackupBusy(true);
      await exportDatabase();
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.settings.backupFailed,
        e instanceof Error ? e.message : el.settings.exportFailed,
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const runCsvExport = async () => {
    try {
      setCsvBusy(true);
      await generateExcelReport();
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.settings.exportCsvFailed,
        e instanceof Error ? e.message : el.settings.exportCsvFailed,
      );
    } finally {
      setCsvBusy(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      Alert.alert(el.common.error, el.settings.mustBeSignedIn);
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert(el.common.error, el.settings.enterPasswords);
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(el.common.error, el.settings.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(el.common.error, el.settings.passwordMismatch);
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert(el.common.error, el.settings.passwordDifferent);
      return;
    }

    try {
      setPasswordBusy(true);
      await updateUserPassword(user.id, currentPassword, newPassword);
      resetPasswordForm();
      Alert.alert(el.common.success, el.settings.passwordUpdated);
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.settings.passwordUpdateFailed,
        e instanceof Error ? e.message : el.common.tryAgain,
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const onToggleReminder = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert(el.common.error, el.settings.reminderNotAvailable);
      return;
    }
    try {
      await setBackupReminderEnabled(value);
      setReminderOn(value);
      if (value) {
        Alert.alert(
          el.settings.reminderOnTitle,
          el.settings.reminderOnBody,
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert(
        el.common.error,
        e instanceof Error ? e.message : el.settings.reminderFailed,
      );
      await loadReminder();
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
        <View className="px-2 py-3">
          <Text className="text-2xl font-bold text-slate-900">{el.settings.title}</Text>
          <Text className="mt-1 text-sm text-slate-600">{el.settings.subtitle}</Text>
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">{el.settings.profile}</Text>
          <View className="mt-4 border-t border-slate-100 pt-3">
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">{el.settings.name}</Text>
              <Text className="max-w-[60%] text-right font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">{el.settings.email}</Text>
              <Text className="max-w-[60%] text-right font-medium text-slate-900">
                {user?.email}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">{el.settings.role}</Text>
              <Text className="font-medium capitalize text-slate-900">{user?.role}</Text>
            </View>
          </View>

          {!showPasswordForm ? (
            <Pressable
              onPress={() => setShowPasswordForm(true)}
              className="mt-4 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 active:bg-slate-100">
              <MaterialIcons name="lock-outline" size={20} color="#0f172a" />
              <Text className="ml-2 text-sm font-semibold text-slate-900">
                {el.settings.changePassword}
              </Text>
            </Pressable>
          ) : (
            <View className="mt-4 border-t border-slate-100 pt-4">
              <Text className="mb-3 text-sm font-medium text-slate-700">
                {el.settings.changePassword}
              </Text>
              <Input
                label={el.settings.currentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!passwordBusy}
              />
              <Input
                label={el.settings.newPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!passwordBusy}
              />
              <Input
                label={el.settings.confirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!passwordBusy}
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={resetPasswordForm}
                  disabled={passwordBusy}
                  className="flex-1 rounded-xl border border-slate-200 py-3 active:bg-slate-50 disabled:opacity-50">
                  <Text className="text-center text-sm font-semibold text-slate-700">
                    {el.common.cancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={passwordBusy}
                  className="flex-1 rounded-xl bg-slate-900 py-3 active:bg-slate-800 disabled:opacity-50">
                  {passwordBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center text-sm font-semibold text-white">
                      {el.common.save}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">
            {el.settings.practice}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">{el.settings.practiceDesc}</Text>

          {practiceLoading ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#64748b" />
            </View>
          ) : (
            <View className="mt-4">
              <Input
                label={el.settings.legalName}
                value={legalName}
                onChangeText={setLegalName}
                placeholder={el.settings.legalNamePlaceholder}
                autoCapitalize="words"
                editable={!practiceBusy}
              />
              <Input
                label={el.settings.tradeName}
                value={tradeName}
                onChangeText={setTradeName}
                placeholder={el.settings.tradeNamePlaceholder}
                editable={!practiceBusy}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    label={el.settings.practiceAfm}
                    value={practiceAfm}
                    onChangeText={setPracticeAfm}
                    keyboardType="number-pad"
                    maxLength={9}
                    editable={!practiceBusy}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label={el.settings.practiceDoy}
                    value={practiceDoy}
                    onChangeText={setPracticeDoy}
                    editable={!practiceBusy}
                  />
                </View>
              </View>
              <Input
                label={el.settings.activityCode}
                value={activityCode}
                onChangeText={setActivityCode}
                editable={!practiceBusy}
              />
              <Text className="mb-2 text-sm font-medium text-slate-700">
                {el.patients.addressInformation}
              </Text>
              <Input
                label={el.patients.street}
                value={addressStreet}
                onChangeText={setAddressStreet}
                editable={!practiceBusy}
              />
              <View className="flex-row gap-2">
                <View className="flex-[2]">
                  <Input
                    label={el.patients.city}
                    value={addressCity}
                    onChangeText={setAddressCity}
                    editable={!practiceBusy}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label={el.patients.postalCode}
                    value={addressPostalCode}
                    onChangeText={setAddressPostalCode}
                    keyboardType="number-pad"
                    editable={!practiceBusy}
                  />
                </View>
              </View>
              <Input
                label={el.patients.country}
                value={addressCountry}
                onChangeText={setAddressCountry}
                editable={!practiceBusy}
              />
              <Input
                label={el.settings.practicePhone}
                value={practicePhone}
                onChangeText={setPracticePhone}
                keyboardType="phone-pad"
                editable={!practiceBusy}
              />
              <Input
                label={el.settings.practiceEmail}
                value={practiceEmail}
                onChangeText={setPracticeEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!practiceBusy}
              />
              <Input
                label={el.settings.website}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                editable={!practiceBusy}
              />
              <Input
                label={el.settings.defaultVat}
                value={defaultVatRate}
                onChangeText={setDefaultVatRate}
                keyboardType="decimal-pad"
                editable={!practiceBusy}
              />
              <Text className="mb-1 text-sm font-medium text-slate-700">
                {el.settings.invoiceFooter}
              </Text>
              <TextInput
                className="min-h-[72px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900"
                value={invoiceFooter}
                onChangeText={setInvoiceFooter}
                placeholder={el.settings.invoiceFooterPlaceholder}
                multiline
                textAlignVertical="top"
                editable={!practiceBusy}
              />
              {!legalName.trim() || !practiceAfm.trim() ? (
                <Text className="mt-2 text-xs text-amber-700">
                  {el.settings.practiceIncompleteHint}
                </Text>
              ) : null}
              <Pressable
                onPress={handleSavePractice}
                disabled={practiceBusy}
                className="mt-4 flex-row items-center justify-center rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-50">
                {practiceBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={22} color="#fff" />
                    <Text className="ml-2 text-base font-semibold text-white">
                      {el.common.save}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">
            {el.settings.appointmentReminders}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            {el.settings.appointmentRemindersDesc}
          </Text>

          <View className="mt-4 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
            <Text className="text-sm font-medium text-slate-900">
              {el.settings.appointmentRemindersEnabled}
            </Text>
            {aptReminderLoading ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Switch
                value={aptReminderEnabled}
                onValueChange={(v) => {
                  setAptReminderEnabled(v);
                  persistAptReminders({enabled: v});
                }}
                trackColor={{false: '#cbd5e1', true: '#93c5fd'}}
                thumbColor={aptReminderEnabled ? '#1d4ed8' : '#f1f5f9'}
              />
            )}
          </View>

          <View className="mt-3 flex-row gap-2">
            <Pressable
              onPress={() => {
                setAptReminderHours(24);
                persistAptReminders({hoursBefore: 24});
              }}
              className={`flex-1 rounded-lg border py-2 ${
                aptReminderHours === 24
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}>
              <Text
                className={`text-center text-sm font-medium ${
                  aptReminderHours === 24 ? 'text-blue-800' : 'text-slate-700'
                }`}>
                {el.settings.hoursBefore24}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setAptReminderHours(48);
                persistAptReminders({hoursBefore: 48});
              }}
              className={`flex-1 rounded-lg border py-2 ${
                aptReminderHours === 48
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 bg-white'
              }`}>
              <Text
                className={`text-center text-sm font-medium ${
                  aptReminderHours === 48 ? 'text-blue-800' : 'text-slate-700'
                }`}>
                {el.settings.hoursBefore48}
              </Text>
            </Pressable>
          </View>

          <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-100 px-3 py-3">
            <Text className="text-sm text-slate-800">{el.settings.channelLocalPush}</Text>
            <Switch
              value={aptReminderPush}
              disabled={Platform.OS === 'web'}
              onValueChange={(v) => {
                setAptReminderPush(v);
                const channels: ReminderChannel[] = [];
                if (v) {
                  channels.push('local_push');
                }
                if (aptReminderSms) {
                  channels.push('sms');
                }
                persistAptReminders({
                  channels: channels.length ? channels : ['local_push'],
                });
              }}
            />
          </View>

          <View className="mt-2 flex-row items-center justify-between rounded-xl border border-slate-100 px-3 py-3">
            <Text className="text-sm text-slate-800">{el.settings.channelSms}</Text>
            <Switch
              value={aptReminderSms}
              onValueChange={(v) => {
                setAptReminderSms(v);
                const channels: ReminderChannel[] = [];
                if (aptReminderPush) {
                  channels.push('local_push');
                }
                if (v) {
                  channels.push('sms');
                }
                persistAptReminders({
                  channels: channels.length ? channels : ['local_push'],
                });
              }}
            />
          </View>

          {isSmsGatewayConfigured() ? (
            <Pressable
              onPress={handleTestSms}
              className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 active:bg-slate-100">
              <MaterialIcons name="sms" size={20} color="#0f172a" />
              <Text className="ml-2 text-sm font-semibold text-slate-900">
                {el.settings.testSms}
              </Text>
            </Pressable>
          ) : (
            <Text className="mt-2 text-xs text-amber-700">
              {el.settings.testSmsNoGateway}
            </Text>
          )}
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">{el.settings.system}</Text>
          <Text className="mt-1 text-sm text-slate-600">{el.settings.systemDesc}</Text>

          <Pressable
            onPress={runBackup}
            disabled={backupBusy}
            className="mt-4 flex-row items-center justify-center rounded-xl bg-slate-900 py-3.5 active:bg-slate-800 disabled:opacity-50">
            {backupBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save-alt" size={22} color="#fff" />
                <Text className="ml-2 text-base font-semibold text-white">
                  {el.settings.backupNow}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={runCsvExport}
            disabled={csvBusy}
            className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3.5 active:bg-slate-100 disabled:opacity-50">
            {csvBusy ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <MaterialIcons name="table-chart" size={22} color="#0f172a" />
                <Text className="ml-2 text-base font-semibold text-slate-900">
                  {el.settings.exportCsvLong}
                </Text>
              </>
            )}
          </Pressable>

          <View className="mt-5 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
            <View className="mr-3 flex-1">
              <Text className="text-sm font-medium text-slate-900">
                {el.settings.autoReminder}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600">
                {el.settings.autoReminderDesc}
              </Text>
            </View>
            {reminderLoading ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Switch
                value={reminderOn}
                onValueChange={onToggleReminder}
                disabled={Platform.OS === 'web'}
                trackColor={{false: '#cbd5e1', true: '#93c5fd'}}
                thumbColor={reminderOn ? '#1d4ed8' : '#f1f5f9'}
              />
            )}
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          className="rounded-2xl border border-red-200 bg-red-50 py-3.5 active:bg-red-100">
          <Text className="text-center text-base font-semibold text-red-700">
            {el.settings.logout}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default SettingsScreen;
