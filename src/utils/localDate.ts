/**
 * Calendar dates without timezone shift (store/read YYYY-MM-DD in local time).
 */

import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export type AppointmentCalendarView = 'day' | 'week' | 'month' | 'year';

export function formatLocalDateForDb(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateFromDb(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map((v) => Number.parseInt(v, 10));
  return new Date(year, month - 1, day);
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const WEEK_OPTS = {weekStartsOn: 1 as const};

export function getAppointmentViewRange(
  anchor: Date,
  view: AppointmentCalendarView,
): {start: Date; end: Date} {
  const base = startOfLocalDay(anchor);
  switch (view) {
    case 'day':
      return {start: base, end: base};
    case 'week':
      return {
        start: startOfWeek(base, WEEK_OPTS),
        end: endOfWeek(base, WEEK_OPTS),
      };
    case 'month':
      return {start: startOfMonth(base), end: endOfMonth(base)};
    case 'year':
      return {start: startOfYear(base), end: endOfYear(base)};
  }
}

export function shiftAppointmentAnchor(
  anchor: Date,
  view: AppointmentCalendarView,
  direction: -1 | 1,
): Date {
  const d = new Date(anchor);
  switch (view) {
    case 'day':
      d.setDate(d.getDate() + direction);
      break;
    case 'week':
      d.setDate(d.getDate() + direction * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() + direction);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + direction);
      break;
  }
  return startOfLocalDay(d);
}

export function formatAppointmentViewPeriod(
  anchor: Date,
  view: AppointmentCalendarView,
): string {
  const {start, end} = getAppointmentViewRange(anchor, view);
  const fmtDay = new Intl.DateTimeFormat('en-US', {day: 'numeric', month: 'short'});
  const fmtMonthYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const fmtYear = new Intl.DateTimeFormat('en-US', {year: 'numeric'});

  switch (view) {
    case 'day':
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(start);
    case 'week':
      return `${fmtDay.format(start)} – ${fmtDay.format(end)}`;
    case 'month':
      return fmtMonthYear.format(start);
    case 'year':
      return fmtYear.format(start);
  }
}
