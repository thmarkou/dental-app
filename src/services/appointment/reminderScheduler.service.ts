/**
 * Appointment reminders — local push (expo-notifications) + scheduled SMS log.
 */

import {Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';
import {
  getPracticeDisplayName,
  getPracticeSettings,
} from '../settings/practiceSettings.service';
import {getPatientById} from '../patient';
import type {Appointment, AppointmentStatus} from '../../types';
import {UI_LOCALE} from '../../i18n';
import {parseLocalDateFromDb} from '../../utils/localDate';
import {sendSms, isSmsGatewayConfigured} from './smsGateway.service';

const PRACTICE_SETTINGS_ID = 'practice_default';
const ANDROID_CHANNEL_ID = 'appointment-reminders';

export type ReminderChannel = 'local_push' | 'sms';

export interface PracticeReminderSettings {
  enabled: boolean;
  hoursBefore: number;
  channels: ReminderChannel[];
}

const SKIP_STATUSES: AppointmentStatus[] = [
  'cancelled',
  'completed',
  'no_show',
];

function parseChannelsJson(raw: unknown): ReminderChannel[] {
  if (raw == null || String(raw).trim() === '') {
    return ['local_push'];
  }
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) {
      return ['local_push'];
    }
    return parsed.filter(
      (c): c is ReminderChannel => c === 'local_push' || c === 'sms',
    );
  } catch {
    return ['local_push'];
  }
}

export async function ensureAppointmentNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Appointment reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export function getPracticeReminderSettings(): PracticeReminderSettings {
  const db = getDatabase();
  const row = db.execute(
    'SELECT * FROM reminder_settings WHERE id = ?',
    [PRACTICE_SETTINGS_ID],
  ).rows?._array?.[0] as Record<string, unknown> | undefined;

  if (!row) {
    return {enabled: true, hoursBefore: 24, channels: ['local_push']};
  }

  return {
    enabled: Number(row.enabled ?? 1) === 1,
    hoursBefore: Number(row.hours_before ?? 24),
    channels: parseChannelsJson(row.channels),
  };
}

export function savePracticeReminderSettings(
  settings: PracticeReminderSettings,
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO reminder_settings (
      id, scope, patient_id, enabled, hours_before, channels, updated_at
    ) VALUES (?, 'practice', NULL, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      enabled = excluded.enabled,
      hours_before = excluded.hours_before,
      channels = excluded.channels,
      updated_at = excluded.updated_at`,
    [
      PRACTICE_SETTINGS_ID,
      settings.enabled ? 1 : 0,
      settings.hoursBefore,
      JSON.stringify(settings.channels),
      now,
    ],
  );
}

function reminderFireAt(appointment: Appointment, hoursBefore: number): Date {
  return new Date(
    appointment.startTime.getTime() - hoursBefore * 60 * 60 * 1000,
  );
}

function formatAppointmentDateTime(start: Date): {date: string; time: string} {
  return {
    date: new Intl.DateTimeFormat(UI_LOCALE, {dateStyle: 'medium'}).format(start),
    time: new Intl.DateTimeFormat(UI_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(start),
  };
}

function buildSmsBody(
  clinicName: string,
  patientName: string,
  date: string,
  time: string,
  phone?: string,
): string {
  const contact = phone?.trim() ? ` Επικοινωνία: ${phone.trim()}.` : '';
  return `${clinicName}: Υπενθύμιση ραντεβού ${date} ${time}. ${patientName}.${contact}`;
}

function buildPushBody(patientName: string, date: string, time: string): string {
  return `Ραντεβού ${date} ${time} — ${patientName}`;
}

function insertReminderLog(
  appointmentId: string,
  channel: ReminderChannel,
  scheduledFor: string,
  notificationId: string | null,
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled',
  errorMessage?: string,
): string {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO appointment_reminder_log (
      id, appointment_id, channel, scheduled_for, sent_at, status,
      error_message, notification_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      appointmentId,
      channel,
      scheduledFor,
      status === 'sent' ? now : null,
      status,
      errorMessage ?? null,
      notificationId,
      now,
    ],
  );
  return id;
}

async function cancelScheduledLogs(appointmentId: string): Promise<void> {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT id, notification_id FROM appointment_reminder_log
       WHERE appointment_id = ? AND status = 'scheduled'`,
      [appointmentId],
    ).rows?._array ?? [];

  for (const row of rows as {id?: string; notification_id?: string}[]) {
    if (row.notification_id && Platform.OS !== 'web') {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          String(row.notification_id),
        );
      } catch {
        // ignore
      }
    }
    if (row.id) {
      db.execute(
        `UPDATE appointment_reminder_log SET status = 'cancelled' WHERE id = ?`,
        [String(row.id)],
      );
    }
  }
}

async function scheduleLocalPush(
  appointment: Appointment,
  patientName: string,
  fireAt: Date,
): Promise<void> {
  if (Platform.OS === 'web' || fireAt.getTime() <= Date.now()) {
    return;
  }

  const {status} = await Notifications.getPermissionsAsync();
  let final = status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    final = req.status;
  }
  if (final !== 'granted') {
    insertReminderLog(
      appointment.id,
      'local_push',
      fireAt.toISOString(),
      null,
      'failed',
      'Notification permission denied',
    );
    return;
  }

  await ensureAppointmentNotificationChannel();
  const {date, time} = formatAppointmentDateTime(appointment.startTime);
  const practice = getPracticeSettings();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: getPracticeDisplayName(practice),
      body: buildPushBody(patientName, date, time),
      data: {appointmentId: appointment.id},
    },
    trigger: {
      date: fireAt,
      ...(Platform.OS === 'android' ? {channelId: ANDROID_CHANNEL_ID} : {}),
    },
  });

  insertReminderLog(
    appointment.id,
    'local_push',
    fireAt.toISOString(),
    notificationId,
    'scheduled',
  );
}

function scheduleSmsLog(
  appointment: Appointment,
  fireAt: Date,
): void {
  insertReminderLog(
    appointment.id,
    'sms',
    fireAt.toISOString(),
    null,
    'scheduled',
  );
}

function markAppointmentReminderSent(appointmentId: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.execute(
    'UPDATE appointments SET reminder_sent = 1, reminder_sent_at = ?, updated_at = ? WHERE id = ?',
    [now, now, appointmentId],
  );
}

/** (Re)schedule reminders after create/update. */
export async function scheduleRemindersForAppointment(
  appointment: Appointment,
): Promise<void> {
  await cancelRemindersForAppointment(appointment.id);

  const settings = getPracticeReminderSettings();
  if (!settings.enabled) {
    return;
  }
  if (SKIP_STATUSES.includes(appointment.status)) {
    return;
  }

  const patient = await getPatientById(appointment.patientId);
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : 'Ασθενής';

  const fireAt = reminderFireAt(appointment, settings.hoursBefore);
  if (fireAt.getTime() >= appointment.startTime.getTime()) {
    return;
  }

  if (settings.channels.includes('local_push')) {
    await scheduleLocalPush(appointment, patientName, fireAt);
  }

  if (settings.channels.includes('sms') && isSmsGatewayConfigured()) {
    scheduleSmsLog(appointment, fireAt);
  }
}

export async function cancelRemindersForAppointment(
  appointmentId: string,
): Promise<void> {
  await cancelScheduledLogs(appointmentId);
}

async function sendSmsForAppointment(
  appointment: Appointment,
  logId: string,
): Promise<void> {
  const db = getDatabase();
  const patient = await getPatientById(appointment.patientId);
  if (!patient?.phone?.trim()) {
    db.execute(
      `UPDATE appointment_reminder_log SET status = 'failed', error_message = ? WHERE id = ?`,
      ['Patient has no phone number', logId],
    );
    return;
  }

  const practice = getPracticeSettings();
  const clinicName = getPracticeDisplayName(practice);
  const {date, time} = formatAppointmentDateTime(appointment.startTime);
  const body = buildSmsBody(
    clinicName,
    `${patient.firstName} ${patient.lastName}`.trim(),
    date,
    time,
    practice.phone ?? undefined,
  );

  try {
    await sendSms(patient.phone, body);
    const now = new Date().toISOString();
    db.execute(
      `UPDATE appointment_reminder_log SET status = 'sent', sent_at = ? WHERE id = ?`,
      [now, logId],
    );
    markAppointmentReminderSent(appointment.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'SMS failed';
    db.execute(
      `UPDATE appointment_reminder_log SET status = 'failed', error_message = ? WHERE id = ?`,
      [msg, logId],
    );
    throw e;
  }
}

/** Process SMS rows whose scheduled_for has passed (call on app start / resume). */
export async function processDueSmsReminders(): Promise<number> {
  if (!isSmsGatewayConfigured()) {
    return 0;
  }

  const db = getDatabase();
  const now = new Date().toISOString();
  const rows =
    db.execute(
      `SELECT l.id AS log_id, l.appointment_id
       FROM appointment_reminder_log l
       INNER JOIN appointments a ON a.id = l.appointment_id
       WHERE l.channel = 'sms' AND l.status = 'scheduled' AND l.scheduled_for <= ?
         AND a.status NOT IN ('cancelled', 'completed', 'no_show')`,
      [now],
    ).rows?._array ?? [];

  let sent = 0;
  for (const row of rows as {log_id?: string; appointment_id?: string}[]) {
    const aptRow = db.execute('SELECT * FROM appointments WHERE id = ?', [
      row.appointment_id,
    ]).rows?._array?.[0];
    if (!aptRow || !row.log_id) {
      continue;
    }
    const appointment = mapAppointmentRow(aptRow as Record<string, unknown>);
    try {
      await sendSmsForAppointment(appointment, String(row.log_id));
      sent += 1;
    } catch {
      // logged on row
    }
  }
  return sent;
}

/** Manual send from appointment detail. */
export async function sendAppointmentReminderSmsNow(
  appointmentId: string,
): Promise<void> {
  const db = getDatabase();
  const row = db.execute('SELECT * FROM appointments WHERE id = ?', [
    appointmentId,
  ]).rows?._array?.[0];
  if (!row) {
    throw new Error('Appointment not found');
  }
  const appointment = mapAppointmentRow(row as Record<string, unknown>);
  const logId = insertReminderLog(
    appointmentId,
    'sms',
    new Date().toISOString(),
    null,
    'scheduled',
  );
  await sendSmsForAppointment(appointment, logId);
}

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    date: parseLocalDateFromDb(String(row.date)),
    startTime: new Date(String(row.start_time)),
    endTime: new Date(String(row.end_time)),
    duration: Number(row.duration),
    type: row.type as Appointment['type'],
    status: row.status as Appointment['status'],
    doctorId: String(row.doctor_id),
    chairId: row.chair_id != null ? String(row.chair_id) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    reminderSent: Number(row.reminder_sent ?? 0) === 1,
    reminderSentAt:
      row.reminder_sent_at != null
        ? new Date(String(row.reminder_sent_at))
        : undefined,
    createdAt: new Date(String(row.created_at)),
    createdBy: String(row.created_by),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export function formatReminderChannelsLabel(
  channels: ReminderChannel[],
): string {
  const parts: string[] = [];
  if (channels.includes('local_push')) {
    parts.push('ειδοποίηση');
  }
  if (channels.includes('sms')) {
    parts.push('SMS');
  }
  return parts.join(' + ') || '—';
}
