/**
 * myDATA (AADE) invoice simulation — builds a JSON payload and records a dummy submission mark.
 */

import {getDatabase} from '../database';
import {getPatientById} from '../patient';
import {applyMyDataSubmission, getPaymentById} from './payment.service';
import {applyMyDataToReceipt, getReceiptById} from './receipt.service';

/** Simplified structure inspired by Greek e-invoicing fields (simulation only). */
export interface AadeInvoicePayload {
  version: string;
  invoiceType: string;
  issueDate: string;
  counterparty: {
    vatNumber: string;
    name: string;
    taxOffice?: string;
  };
  lines: Array<{
    lineNumber: number;
    treatmentTypesSummary: string;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }>;
  payment: {
    id: string;
    method: string;
    amount: number;
  };
  metadata: {
    source: string;
    simulated: true;
  };
}

function treatmentTypesBeforeDate(
  patientId: string,
  transactionDateYmd: string,
): string {
  const db = getDatabase();
  const row = db.execute(
    `SELECT GROUP_CONCAT(DISTINCT COALESCE(NULLIF(TRIM(procedure_type), ''), 'Unspecified'), '; ') AS types
     FROM treatments
     WHERE patient_id = ?
       AND date(created_at) <= date(?)`,
    [patientId, transactionDateYmd],
  ).rows?._array?.[0] as {types?: string} | undefined;

  const raw = row?.types != null ? String(row.types) : '';
  return raw.trim() !== '' ? raw : 'Dental services';
}

function dummyMyDataMark(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `MYDATA-${n}`;
}

/**
 * Collect patient AFM, amount, and treatment context into an AADE-oriented JSON object.
 */
export async function prepareInvoice(
  paymentId: string,
): Promise<AadeInvoicePayload> {
  const payment = getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const patient = await getPatientById(payment.patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const issueDate = payment.transactionDate.slice(0, 10);
  const treatmentSummary = treatmentTypesBeforeDate(
    payment.patientId,
    issueDate,
  );
  const gross = Number(payment.amount.toFixed(2));

  return {
    version: '1.0',
    invoiceType: '11.1',
    issueDate,
    counterparty: {
      vatNumber: patient.afm?.trim() ?? '',
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      taxOffice: patient.doy?.trim() || undefined,
    },
    lines: [
      {
        lineNumber: 1,
        treatmentTypesSummary: treatmentSummary,
        netAmount: gross,
        vatAmount: 0,
        grossAmount: gross,
      },
    ],
    payment: {
      id: payment.id,
      method: payment.paymentMethod,
      amount: gross,
    },
    metadata: {
      source: 'dentalapp-mydata-simulation',
      simulated: true,
    },
  };
}

/**
 * Simulated submission: logs payload, then sets myDATA mark and receipt_issued on the payment.
 */
export async function submitToMyData(paymentId: string): Promise<string> {
  const payload = await prepareInvoice(paymentId);
  console.log('[myDATA simulation]', JSON.stringify(payload, null, 2));
  const mark = dummyMyDataMark();
  applyMyDataSubmission(paymentId, mark);
  return mark;
}

/**
 * myDATA submission tied to a formal receipt (απόδειξη).
 */
export async function submitReceiptToMyData(receiptId: string): Promise<string> {
  const receipt = getReceiptById(receiptId);
  if (!receipt) {
    throw new Error('Receipt not found');
  }

  const patient = await getPatientById(receipt.patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const payload: AadeInvoicePayload = {
    version: '1.0',
    invoiceType: '11.1',
    issueDate: receipt.issueDate,
    counterparty: {
      vatNumber: patient.afm?.trim() ?? '',
      name: `${patient.firstName} ${patient.lastName}`.trim(),
      taxOffice: patient.doy?.trim() || undefined,
    },
    lines: (receipt.lines ?? []).map((line, i) => ({
      lineNumber: i + 1,
      treatmentTypesSummary: line.description,
      netAmount: line.unitPrice * line.quantity,
      vatAmount: line.vatAmount,
      grossAmount: line.lineTotal,
    })),
    payment: {
      id: receipt.paymentId ?? receipt.id,
      method: receipt.paymentMethod,
      amount: receipt.totalAmount,
    },
    metadata: {
      source: 'dentalapp-receipt-mydata-simulation',
      simulated: true,
    },
  };

  console.log('[myDATA receipt simulation]', JSON.stringify(payload, null, 2));
  const mark = dummyMyDataMark();
  applyMyDataToReceipt(receiptId, mark);
  return mark;
}
