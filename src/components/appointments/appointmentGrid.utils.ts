import {Appointment} from '../../types/appointment';
import {Patient} from '../../types';
import {formatLocalDateForDb, startOfLocalDay} from '../../utils/localDate';

export const GRID_HOUR_START = 8;
export const GRID_HOUR_END = 20;
export const GRID_SLOT_MINUTES = 30;

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
  return new Intl.DateTimeFormat('en-US', {
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

export function appointmentsInSlot(
  dayAppointments: Appointment[],
  slotIndex: number,
): Appointment[] {
  return dayAppointments.filter((a) => slotIndexForDate(a.startTime) === slotIndex);
}

export function patientLabel(
  patients: Record<string, Patient>,
  patientId: string,
): string {
  const p = patients[patientId];
  if (!p) {
    return '?';
  }
  return `${p.firstName.charAt(0)}. ${p.lastName}`;
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
