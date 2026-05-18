/**
 * Payment receipts (αποδείξεις) — linked to payments and optional invoices.
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';
import {allocateFiscalNumber} from './fiscalSequence.service';
import {DEFAULT_VAT_RATE} from './invoice.service';
import {getPaymentById} from './payment.service';

export interface ReceiptLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}

export interface ReceiptLineRow extends ReceiptLineInput {
  id: string;
  receiptId: string;
  vatAmount: number;
  lineTotal: number;
  sortOrder: number;
}

export interface ReceiptRow {
  id: string;
  receiptNumber: string;
  patientId: string;
  invoiceId: string | null;
  paymentId: string | null;
  issueDate: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  mydataMark: string | null;
  mydataSubmittedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  lines?: ReceiptLineRow[];
}

export interface CreateReceiptInput {
  patientId: string;
  lines: ReceiptLineInput[];
  paymentMethod: string;
  issueDate?: string;
  vatRate?: number;
  invoiceId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  /** When true, also inserts a payment row linked to this receipt. */
  recordPayment?: boolean;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeReceiptTotals(
  lines: ReceiptLineInput[],
  defaultVatRate: number,
): {subtotal: number; vatAmount: number; totalAmount: number} {
  let subtotal = 0;
  let vatAmount = 0;
  for (const line of lines) {
    const net = roundMoney(line.quantity * line.unitPrice);
    const rate = line.vatRate ?? defaultVatRate;
    const vat = roundMoney((net * rate) / 100);
    subtotal = roundMoney(subtotal + net);
    vatAmount = roundMoney(vatAmount + vat);
  }
  return {
    subtotal,
    vatAmount,
    totalAmount: roundMoney(subtotal + vatAmount),
  };
}

function mapReceiptRow(row: Record<string, unknown>): ReceiptRow {
  return {
    id: String(row.id),
    receiptNumber: String(row.receipt_number),
    patientId: String(row.patient_id),
    invoiceId: row.invoice_id != null ? String(row.invoice_id) : null,
    paymentId: row.payment_id != null ? String(row.payment_id) : null,
    issueDate: String(row.issue_date),
    subtotal: Number(row.subtotal),
    vatRate: Number(row.vat_rate),
    vatAmount: Number(row.vat_amount),
    totalAmount: Number(row.total_amount),
    paymentMethod: String(row.payment_method),
    mydataMark:
      row.mydata_mark != null && String(row.mydata_mark).trim() !== ''
        ? String(row.mydata_mark)
        : null,
    mydataSubmittedAt:
      row.mydata_submitted_at != null ? String(row.mydata_submitted_at) : null,
    notes: row.notes != null ? String(row.notes) : null,
    createdBy: row.created_by != null ? String(row.created_by) : null,
    createdAt: String(row.created_at),
  };
}

function mapReceiptLineRow(row: Record<string, unknown>): ReceiptLineRow {
  return {
    id: String(row.id),
    receiptId: String(row.receipt_id),
    description: String(row.description),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    vatRate: Number(row.vat_rate),
    vatAmount: Number(row.vat_amount),
    lineTotal: Number(row.line_total),
    sortOrder: Number(row.sort_order),
  };
}

export const getReceiptLines = (receiptId: string): ReceiptLineRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT * FROM receipt_lines WHERE receipt_id = ? ORDER BY sort_order ASC, id ASC`,
      [receiptId],
    ).rows?._array ?? [];
  return rows.map((r: Record<string, unknown>) => mapReceiptLineRow(r));
};

export const getReceiptByPaymentId = (
  paymentId: string,
): ReceiptRow | null => {
  const db = getDatabase();
  const row = db.execute('SELECT * FROM receipts WHERE payment_id = ?', [
    paymentId,
  ]).rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  const receipt = mapReceiptRow(row);
  receipt.lines = getReceiptLines(receipt.id);
  return receipt;
};

export const getReceiptById = (receiptId: string): ReceiptRow | null => {
  const db = getDatabase();
  const row = db.execute('SELECT * FROM receipts WHERE id = ?', [receiptId])
    .rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  const receipt = mapReceiptRow(row);
  receipt.lines = getReceiptLines(receiptId);
  return receipt;
};

export const getPatientReceipts = (patientId: string): ReceiptRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT * FROM receipts WHERE patient_id = ? ORDER BY issue_date DESC, created_at DESC`,
      [patientId],
    ).rows?._array ?? [];
  return rows.map((r: Record<string, unknown>) => mapReceiptRow(r));
};

export const paymentHasReceipt = (paymentId: string): boolean => {
  const db = getDatabase();
  const row = db.execute(
    'SELECT receipt_id FROM payments WHERE id = ?',
    [paymentId],
  ).rows?._array?.[0] as {receipt_id?: string | null} | undefined;
  return row?.receipt_id != null && String(row.receipt_id).trim() !== '';
};

export const createReceipt = (input: CreateReceiptInput): ReceiptRow => {
  if (input.lines.length === 0) {
    throw new Error('Add at least one line item.');
  }

  const db = getDatabase();
  const vatRate = input.vatRate ?? DEFAULT_VAT_RATE;
  const {subtotal, vatAmount, totalAmount} = computeReceiptTotals(
    input.lines,
    vatRate,
  );
  const id = uuidv4();
  const receiptNumber = allocateFiscalNumber('receipt');
  const now = new Date().toISOString();
  const issueDate = input.issueDate ?? now.slice(0, 10);
  let paymentId: string | null = null;

  db.execute('BEGIN TRANSACTION;');
  try {
    if (input.recordPayment !== false) {
      paymentId = uuidv4();
      db.execute(
        `INSERT INTO payments (
          id, patient_id, amount, payment_method, transaction_date, receipt_issued, notes, invoice_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          input.patientId,
          totalAmount,
          input.paymentMethod,
          now,
          1,
          input.notes ?? `Receipt ${receiptNumber}`,
          input.invoiceId ?? null,
        ],
      );
    }

    db.execute(
      `INSERT INTO receipts (
        id, receipt_number, patient_id, invoice_id, payment_id, issue_date,
        subtotal, vat_rate, vat_amount, total_amount, payment_method,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        receiptNumber,
        input.patientId,
        input.invoiceId ?? null,
        paymentId,
        issueDate,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        input.paymentMethod,
        input.notes ?? null,
        input.createdBy ?? null,
        now,
      ],
    );

    input.lines.forEach((line, index) => {
      const lineId = uuidv4();
      const net = roundMoney(line.quantity * line.unitPrice);
      const lineVatRate = line.vatRate ?? vatRate;
      const lineVat = roundMoney((net * lineVatRate) / 100);
      const lineTotal = roundMoney(net + lineVat);
      db.execute(
        `INSERT INTO receipt_lines (
          id, receipt_id, description, quantity, unit_price, vat_rate, vat_amount, line_total, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          id,
          line.description.trim(),
          line.quantity,
          line.unitPrice,
          lineVatRate,
          lineVat,
          lineTotal,
          index,
        ],
      );
    });

    if (paymentId) {
      db.execute('UPDATE payments SET receipt_id = ? WHERE id = ?', [
        id,
        paymentId,
      ]);
    }

    db.execute('COMMIT;');
  } catch (e) {
    db.execute('ROLLBACK;');
    throw e;
  }

  return getReceiptById(id)!;
};

/** Issue a receipt for an existing payment that has no receipt yet. */
export const createReceiptForPayment = (
  paymentId: string,
  createdBy?: string | null,
): ReceiptRow => {
  if (paymentHasReceipt(paymentId)) {
    throw new Error('This payment already has a receipt.');
  }

  const payment = getPaymentById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  const db = getDatabase();
  const receiptNumber = allocateFiscalNumber('receipt');
  const id = uuidv4();
  const now = new Date().toISOString();
  const issueDate = payment.transactionDate.slice(0, 10);
  const amount = roundMoney(payment.amount);
  const vatRate = 0;
  const subtotal = amount;
  const vatAmount = 0;
  const totalAmount = amount;

  db.execute('BEGIN TRANSACTION;');
  try {
    db.execute(
      `INSERT INTO receipts (
        id, receipt_number, patient_id, invoice_id, payment_id, issue_date,
        subtotal, vat_rate, vat_amount, total_amount, payment_method,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        receiptNumber,
        payment.patientId,
        null,
        paymentId,
        issueDate,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        payment.paymentMethod,
        payment.notes,
        createdBy ?? null,
        now,
      ],
    );

    db.execute(
      `INSERT INTO receipt_lines (
        id, receipt_id, description, quantity, unit_price, vat_rate, vat_amount, line_total, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        id,
        'Dental services',
        1,
        amount,
        vatRate,
        vatAmount,
        totalAmount,
        0,
      ],
    );

    db.execute(
      'UPDATE payments SET receipt_id = ?, receipt_issued = 1 WHERE id = ?',
      [id, paymentId],
    );

    db.execute('COMMIT;');
  } catch (e) {
    db.execute('ROLLBACK;');
    throw e;
  }

  return getReceiptById(id)!;
};

export const applyMyDataToReceipt = (
  receiptId: string,
  mydataMark: string,
): void => {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.execute(
    'UPDATE receipts SET mydata_mark = ?, mydata_submitted_at = ? WHERE id = ?',
    [mydataMark, now, receiptId],
  );

  const receipt = getReceiptById(receiptId);
  if (receipt?.paymentId) {
    db.execute(
      'UPDATE payments SET mydata_mark = ?, receipt_issued = 1 WHERE id = ?',
      [mydataMark, receipt.paymentId],
    );
  }
};
