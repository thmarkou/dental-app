import {Appointment} from '../../types/appointment';
import {AppointmentStatus, AppointmentType, Patient} from '../../types';
import {formatLocalDateForDb, startOfLocalDay} from '../../utils/localDate';
import {
  appointmentStatusLabel,
  appointmentTypeLabel,
  UI_LOCALE,
} from '../../i18n';

export const GRID_HOUR_START = 8;
export const GRID_HOUR_END = 20;
export const GRID_SLOT_MINUTES = 30;

export interface GridDimensions {
  timeColW: number;
  dayColW: number;
  rowH: number;
  aptTimeSize: number;
  aptNameSize: number;
  aptMetaSize: number;
  dayMinHeight: number;
}

export function getGridDimensions(layoutWidth: number): GridDimensions {
  if (layoutWidth >= 720) {
    return {
      timeColW: 52,
      dayColW: 124,
      rowH: 64,
      aptTimeSize: 11,
      aptNameSize: 12,
      aptMetaSize: 10,
      dayMinHeight: 120,
    };
  }
  if (layoutWidth >= 400) {
    return {
      timeColW: 50,
      dayColW: 104,
      rowH: 56,
      aptTimeSize: 10,
      aptNameSize: 11,
      aptMetaSize: 9,
      dayMinHeight: 104,
    };
  }
  return {
    timeColW: 46,
    dayColW: 88,
    rowH: 48,
    aptTimeSize: 10,
    aptNameSize: 10,
    aptMetaSize: 9,
    dayMinHeight: 96,
  };
}

export function generateTimeSlotLabels(): string[] {
  const slots: string[] = [];
  for (let h = GRID_HOUR_START; h < GRID_HOUR_END; h++) {
    for (let m = 0; m < 60; m += GRID_SLOT_MINUTES) {
      slots.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      );
    }
  }
  return slots;
}

export function formatTimeShort(d: Date): string {
  return new Intl.DateTimeFormat(UI_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function appointmentsOnDay(
  appointments: Appointment[],
  day: Date,
): Appointment[] {
  const key = formatLocalDateForDb(day);
  return appointments
    .filter((a) => formatLocalDateForDb(a.date) === key)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function slotIndexForDate(d: Date): number {
  const startMin = GRID_HOUR_START * 60;
  const total = d.getHours() * 60 + d.getMinutes() - startMin;
  if (total < 0) {
    return -1;
  }
  return Math.floor(total / GRID_SLOT_MINUTES);
}

export function slotSpanForAppointment(apt: Appointment): number {
  return Math.max(1, Math.ceil(apt.duration / GRID_SLOT_MINUTES));
}

export function appointmentStartsInSlot(
  apt: Appointment,
  slotIndex: number,
): boolean {
  return slotIndexForDate(apt.startTime) === slotIndex;
}

export function appointmentsInSlot(
  dayAppointments: Appointment[],
  slotIndex: number,
): Appointment[] {
  return dayAppointments.filter((a) => appointmentStartsInSlot(a, slotIndex));
}

export type PatientNameMode = 'full' | 'short';

export function patientDisplayName(
  patients: Record<string, Patient>,
  patientId: string,
  mode: PatientNameMode = 'full',
): string {
  const p = patients[patientId];
  if (!p) {
    return '?';
  }
  if (mode === 'full') {
    return `${p.firstName} ${p.lastName}`.trim();
  }
  return `${p.firstName.charAt(0)}. ${p.lastName}`;
}

/** @deprecated Use patientDisplayName */
export function patientLabel(
  patients: Record<string, Patient>,
  patientId: string,
): string {
  return patientDisplayName(patients, patientId, 'short');
}

export function statusShortLabel(status: AppointmentStatus | string): string {
  return appointmentStatusLabel(status as AppointmentStatus);
}

export function typeShortLabel(type: AppointmentType | string): string {
  return appointmentTypeLabel(type as AppointmentType);
}

export function statusColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return '#34C759';
    case 'checked_in':
      return '#5856D6';
    case 'in_progress':
      return '#FF9500';
    case 'completed':
      return '#8E8E93';
    case 'cancelled':
    case 'no_show':
      return '#FF3B30';
    default:
      return '#007AFF';
  }
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}
