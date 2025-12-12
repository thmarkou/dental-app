/**
 * Financial-related type definitions
 */

import {PaymentMethod} from './index';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  date: Date;
  dueDate?: Date;
  services: InvoiceItem[];
  subtotal: number;
  discount?: Discount;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  paymentMethod?: PaymentMethod;
  payments: Payment[];
  outstandingBalance: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId?: string;
  patientId: string;
  date: Date;
  time: Date;
  services: ReceiptItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  myDataSubmitted: boolean;
  myDataSubmissionId?: string;
  myDataSubmittedAt?: Date;
  qrCode?: string;
  practiceInfo: PracticeInfo;
  createdAt: Date;
  createdBy: string;
}

export interface ReceiptItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalPrice: number;
}

export interface PracticeInfo {
  name: string;
  address: string;
  taxId: string; // AFM
  phone: string;
  email?: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  receiptId?: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
  isInstallment: boolean;
  installmentPlanId?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  nameGreek: string;
  category: string;
  defaultPrice: number;
  vatRate: number;
  duration: number; // minutes
  isActive: boolean;
  description?: string;
  materials?: string[];
}

