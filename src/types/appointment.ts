/**
 * Appointment-related type definitions
 */

import {AppointmentType, AppointmentStatus} from './index';

export interface Appointment {
  id: string;
  patientId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  type: AppointmentType;
  status: AppointmentStatus;
  doctorId: string;
  chairId?: string; // If multiple chairs/operatories
  notes?: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface RecurringAppointmentSeries {
  id: string;
  patientId: string;
  baseAppointment: Appointment;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  numberOfAppointments?: number;
  endDate?: Date;
  generatedAppointments: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface BlockedHour {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  reason: 'cleaning' | 'sterilization' | 'break' | 'maintenance' | 'other';
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  createdAt: Date;
  createdBy: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: Date;
}

export interface Chair {
  id: string;
  name: string;
  number: number;
  isActive: boolean;
  equipment?: string[];
  notes?: string;
}

