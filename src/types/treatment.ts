/**
 * Treatment-related type definitions
 */

import {TreatmentCategory} from './index';

export interface Treatment {
  id: string;
  patientId: string;
  treatmentPlanId?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  type: TreatmentType;
  category: TreatmentCategory;
  teeth: number[]; // FDI tooth numbering
  description: string;
  clinicalNotes: string;
  preTreatmentCondition: string;
  procedurePerformed: string;
  complications?: string;
  postTreatmentInstructions: string;
  doctorId: string;
  assistantId?: string;
  materialsUsed: MaterialUsage[];
  cost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
  images?: string[];
  xrays?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TreatmentType =
  | 'clinical_examination'
  | 'xray'
  | 'cleaning'
  | 'composite_filling'
  | 'amalgam_filling'
  | 'root_canal'
  | 'extraction'
  | 'implant'
  | 'crown'
  | 'bridge'
  | 'denture'
  | 'whitening'
  | 'veneer'
  | 'orthodontic'
  | 'other';

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  alternatives: TreatmentPlanAlternative[];
  selectedAlternativeId?: string;
  totalEstimatedCost: number;
  status: 'draft' | 'presented' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  approvedAt?: Date;
  approvedBy?: string;
  consentFormId?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface TreatmentPlanAlternative {
  id: string;
  name: string; // e.g., "Conservative approach", "Implant solution"
  description: string;
  phases: TreatmentPlanPhase[];
  totalEstimatedCost: number;
  downPayment?: number;
  installmentPlan?: InstallmentPlan;
}

export interface TreatmentPlanPhase {
  id: string;
  phaseNumber: number;
  name: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  treatments: TreatmentPlanItem[];
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface TreatmentPlanItem {
  treatmentType: TreatmentType;
  teeth: number[];
  description: string;
  estimatedCost: number;
  estimatedDuration: number; // minutes
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  treatmentId?: string;
}

export interface InstallmentPlan {
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  installments: Installment[];
}

export interface Installment {
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: Date;
  paymentId?: string;
}

