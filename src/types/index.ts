/**
 * Type definitions for Dental Practice Management App
 */

// User Roles
export type UserRole = 'admin' | 'dentist' | 'assistant' | 'receptionist';

/** Authenticated app user (aligned with auth store / DB). */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Appointment Types
export type AppointmentType =
  | 'initial_consultation'
  | 'regular_checkup'
  | 'cleaning'
  | 'treatment'
  | 'follow_up'
  | 'emergency'
  | 'consultation';

// Appointment Status
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// Treatment Categories
export type TreatmentCategory =
  | 'preventive'
  | 'restorative'
  | 'endodontic'
  | 'surgical'
  | 'prosthetic'
  | 'orthodontic'
  | 'periodontal'
  | 'aesthetic'
  | 'emergency';

// Payment Methods
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'installment';

// Export all types
export * from './patient';
export * from './appointment';
export * from './treatment';
export * from './financial';

