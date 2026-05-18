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

const SettingsScreen = () => {
  const {width} = useWindowDimensions();
  const isWide = width >= 840;

  const {logout, user} = useAuthStore();
  const [backupBusy, setBackupBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

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
      void loadReminder();
    }, [loadReminder]),
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
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
        'Backup failed',
        e instanceof Error ? e.message : 'Could not export the database.',
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
        'Export failed',
        e instanceof Error ? e.message : 'Could not create the CSV file.',
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
      Alert.alert('Error', 'You must be signed in to change your password.');
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert('Validation', 'Enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Validation', 'Choose a password different from the current one.');
      return;
    }

    try {
      setPasswordBusy(true);
      await updateUserPassword(user.id, currentPassword, newPassword);
      resetPasswordForm();
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Could not update password',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const onToggleReminder = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not available',
        'Local notifications are not supported on web. Use the mobile app for reminders.',
      );
      return;
    }
    try {
      await setBackupReminderEnabled(value);
      setReminderOn(value);
      if (value) {
        Alert.alert(
          'Reminder on',
          'A weekly backup reminder is scheduled (Mondays at 09:00, device local time).',
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Notifications',
        e instanceof Error ? e.message : 'Could not update reminder settings.',
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
          <Text className="text-2xl font-bold text-slate-900">Settings</Text>
          <Text className="mt-1 text-sm text-slate-600">
            Profile, backups, and sign out
          </Text>
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">Profile</Text>
          <View className="mt-4 border-t border-slate-100 pt-3">
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">Name</Text>
              <Text className="max-w-[60%] text-right font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">Email</Text>
              <Text className="max-w-[60%] text-right font-medium text-slate-900">
                {user?.email}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-slate-500">Role</Text>
              <Text className="font-medium capitalize text-slate-900">{user?.role}</Text>
            </View>
          </View>

          {!showPasswordForm ? (
            <Pressable
              onPress={() => setShowPasswordForm(true)}
              className="mt-4 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 active:bg-slate-100">
              <MaterialIcons name="lock-outline" size={20} color="#0f172a" />
              <Text className="ml-2 text-sm font-semibold text-slate-900">
                Change password
              </Text>
            </Pressable>
          ) : (
            <View className="mt-4 border-t border-slate-100 pt-4">
              <Text className="mb-3 text-sm font-medium text-slate-700">Change password</Text>
              <Input
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!passwordBusy}
              />
              <Input
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!passwordBusy}
              />
              <Input
                label="Confirm new password"
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
                  <Text className="text-center text-sm font-semibold text-slate-700">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleChangePassword}
                  disabled={passwordBusy}
                  className="flex-1 rounded-xl bg-slate-900 py-3 active:bg-slate-800 disabled:opacity-50">
                  {passwordBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center text-sm font-semibold text-white">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">System</Text>
          <Text className="mt-1 text-sm text-slate-600">
            Export a full copy of your data or a monthly payment report for your accountant.
          </Text>

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
                  Backup Data Now
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
                  Export Monthly CSV for Accountant
                </Text>
              </>
            )}
          </Pressable>

          <View className="mt-5 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
            <View className="mr-3 flex-1">
              <Text className="text-sm font-medium text-slate-900">
                Automatic Backup Reminder
              </Text>
              <Text className="mt-0.5 text-xs text-slate-600">
                Weekly notification (mobile only) to run a manual backup.
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
          <Text className="text-center text-base font-semibold text-red-700">Logout</Text>
        </Pressable>
      </ScrollView>
    </ScreenSafeArea>
  );
};

export default SettingsScreen;
