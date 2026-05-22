/**
 * Best-effort processing of due SMS reminders when the app becomes active.
 * Reliable 24h-before SMS without a server is not possible on iOS/Android — see docs/APPOINTMENT_REMINDERS.md.
 */

import {AppState, Platform} from 'react-native';
import {processDueSmsReminders} from './reminderScheduler.service';

export function startAppointmentReminderTick(): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  const onActive = () => {
    void processDueSmsReminders();
  };

  const subscription = AppState.addEventListener('change', (next) => {
    if (next === 'active') {
      onActive();
    }
  });

  return () => subscription.remove();
}
