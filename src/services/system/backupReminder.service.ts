/**
 * Weekly local notification to remind the practice to run a manual backup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';

const ENABLED_KEY = 'system_automatic_backup_reminder';
const NOTIFICATION_ID_KEY = 'system_backup_reminder_notification_id';
const ANDROID_CHANNEL_ID = 'backup-reminders';

export function registerNotificationPresentationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Backup reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function getBackupReminderEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ENABLED_KEY);
  return v === '1';
}

/**
 * Enable: requests permission, schedules a weekly Monday 09:00 reminder (device local time).
 * Disable: cancels the scheduled notification.
 * Web: only persists the flag (no scheduling).
 */
export async function setBackupReminderEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
    return;
  }

  if (!enabled) {
    const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
    await AsyncStorage.setItem(ENABLED_KEY, '0');
    return;
  }

  const {status} = await Notifications.getPermissionsAsync();
  let final = status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    final = req.status;
  }
  if (final !== 'granted') {
    throw new Error('Notification permission is required for weekly reminders');
  }

  await ensureAndroidChannel();

  const existing = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing);
  }

  // Weekday 1 = Sunday in expo-notifications; 2 = Monday.
  const trigger: Notifications.WeeklyTriggerInput = {
    weekday: 2,
    hour: 9,
    minute: 0,
    repeats: true,
    ...(Platform.OS === 'android' ? {channelId: ANDROID_CHANNEL_ID} : {}),
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Backup reminder',
      body: 'Create a data backup from Settings → System → Backup Data Now.',
    },
    trigger,
  });

  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);
  await AsyncStorage.setItem(ENABLED_KEY, '1');
}
