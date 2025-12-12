/**
 * Type definitions for Dental Practice Management App
 */

// User Roles
export type UserRole = 'admin' | 'dentist' | 'assistant' | 'receptionist';

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

