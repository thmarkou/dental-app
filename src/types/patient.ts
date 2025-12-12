/**
 * Patient-related type definitions
 */

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  amka?: string;
  phone: string;
  email?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  occupation?: string;
  insurance?: InsuranceInfo;
  medicalHistory?: MedicalHistory;
  dentalHistory?: DentalHistory;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber?: string;
  coverage?: string;
}

export interface MedicalHistory {
  generalConditions: string[];
  currentMedications: Medication[];
  allergies: Allergy[];
  previousSurgeries: string[];
  chronicDiseases: string[];
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'breastfeeding';
  bloodPressure?: BloodPressure;
  notes?: string;
  lastUpdated: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
  date: Date;
}

export interface DentalHistory {
  previousTreatments: PreviousTreatment[];
  orthodonticHistory?: OrthodonticHistory;
  oralHygiene: OralHygiene;
  habits: Habits;
  lastUpdated: Date;
}

export interface PreviousTreatment {
  treatmentType: string;
  date: Date;
  description: string;
  performedBy?: string;
}

export interface OrthodonticHistory {
  hasPreviousTreatment: boolean;
  treatmentType?: string;
  duration?: string;
  completionDate?: Date;
}

export interface OralHygiene {
  brushingFrequency: 'once' | 'twice' | 'thrice' | 'more';
  flossingFrequency: 'daily' | 'weekly' | 'rarely' | 'never';
  mouthwashUsage: boolean;
}

export interface Habits {
  smoking: SmokingHabit;
  alcohol: AlcoholHabit;
  bruxism: boolean;
  tmjIssues: boolean;
}

export interface SmokingHabit {
  status: 'never' | 'former' | 'current';
  frequency?: string;
  duration?: string;
}

export interface AlcoholHabit {
  status: 'never' | 'occasional' | 'regular';
  frequency?: string;
}

