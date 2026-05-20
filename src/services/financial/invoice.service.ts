/**
 * Patient invoices (τιμολόγια) — draft/issue/paid lifecycle.
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';
import {getPracticeSettings} from '../settings/practiceSettings.service';
import {allocateFiscalNumber} from './fiscalSequence.service';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export const DEFAULT_VAT_RATE = 24;

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceLineRow extends InvoiceLineInput {
  id: string;
  invoiceId: string;
  lineTotal: number;
  sortOrder: number;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  patientId: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: InvoiceLineRow[];
}

export interface CreateInvoiceInput {
  patientId: string;
  lines: InvoiceLineInput[];
  issueDate?: string;
  dueDate?: string | null;
  vatRate?: number;
  status?: InvoiceStatus;
  notes?: string | null;
  createdBy?: string | null;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeTotals(
  lines: InvoiceLineInput[],
  vatRate: number,
): {subtotal: number; vatAmount: number; totalAmount: number} {
  const subtotal = roundMoney(
    lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
  );
  const vatAmount = roundMoney((subtotal * vatRate) / 100);
  const totalAmount = roundMoney(subtotal + vatAmount);
  return {subtotal, vatAmount, totalAmount};
}

function mapInvoiceRow(row: Record<string, unknown>): InvoiceRow {
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoice_number),
    patientId: String(row.patient_id),
    issueDate: String(row.issue_date),
    dueDate: row.due_date != null ? String(row.due_date) : null,
    subtotal: Number(row.subtotal),
    vatRate: Number(row.vat_rate),
    vatAmount: Number(row.vat_amount),
    totalAmount: Number(row.total_amount),
    status: row.status as InvoiceStatus,
    notes: row.notes != null ? String(row.notes) : null,
    createdBy: row.created_by != null ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapLineRow(row: Record<string, unknown>): InvoiceLineRow {
  return {
    id: String(row.id),
    invoiceId: String(row.invoice_id),
    description: String(row.description),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
    sortOrder: Number(row.sort_order),
  };
}

export const getInvoiceLines = (invoiceId: string): InvoiceLineRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY sort_order ASC, id ASC`,
      [invoiceId],
    ).rows?._array ?? [];
  return rows.map((r: Record<string, unknown>) => mapLineRow(r));
};

export const getInvoiceById = (invoiceId: string): InvoiceRow | null => {
  const db = getDatabase();
  const row = db.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId])
    .rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  const invoice = mapInvoiceRow(row);
  invoice.lines = getInvoiceLines(invoiceId);
  return invoice;
};

export const getPatientInvoices = (patientId: string): InvoiceRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT * FROM invoices WHERE patient_id = ? ORDER BY issue_date DESC, created_at DESC`,
      [patientId],
    ).rows?._array ?? [];
  return rows.map((r: Record<string, unknown>) => mapInvoiceRow(r));
};

/** Suggest lines from treatment charges (cost > 0). */
export const getTreatmentLineSuggestions = (
  patientId: string,
): InvoiceLineInput[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT id, cost, procedure_type, tooth_number, notes, created_at
       FROM treatments
       WHERE patient_id = ? AND cost IS NOT NULL AND cost > 0
       ORDER BY created_at ASC`,
      [patientId],
    ).rows?._array ?? [];

  return rows.map((r: Record<string, unknown>) => {
    const tooth = r.tooth_number != null ? Number(r.tooth_number) : null;
    const proc =
      r.procedure_type != null && String(r.procedure_type).trim() !== ''
        ? String(r.procedure_type)
        : 'Dental treatment';
    const desc =
      tooth != null ? `${proc} (tooth ${tooth})` : proc;
    return {
      description: desc,
      quantity: 1,
      unitPrice: Number(r.cost),
    };
  });
};

export const createInvoice = (input: CreateInvoiceInput): InvoiceRow => {
  if (input.lines.length === 0) {
    throw new Error('Add at least one line item.');
  }

  const db = getDatabase();
  const vatRate = input.vatRate ?? getPracticeSettings().defaultVatRate ?? DEFAULT_VAT_RATE;
  const {subtotal, vatAmount, totalAmount} = computeTotals(input.lines, vatRate);
  const id = uuidv4();
  const invoiceNumber = allocateFiscalNumber('invoice');
  const now = new Date().toISOString();
  const issueDate = input.issueDate ?? now.slice(0, 10);
  const status = input.status ?? 'issued';

  db.execute('BEGIN TRANSACTION;');
  try {
    db.execute(
      `INSERT INTO invoices (
        id, invoice_number, patient_id, issue_date, due_date,
        subtotal, vat_rate, vat_amount, total_amount, status, notes,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        invoiceNumber,
        input.patientId,
        issueDate,
        input.dueDate ?? null,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        status,
        input.notes ?? null,
        input.createdBy ?? null,
        now,
        now,
      ],
    );

    input.lines.forEach((line, index) => {
      const lineId = uuidv4();
      const lineTotal = roundMoney(line.quantity * line.unitPrice);
      db.execute(
        `INSERT INTO invoice_lines (
          id, invoice_id, description, quantity, unit_price, line_total, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          lineId,
          id,
          line.description.trim(),
          line.quantity,
          line.unitPrice,
          lineTotal,
          index,
        ],
      );
    });

    db.execute('COMMIT;');
  } catch (e) {
    db.execute('ROLLBACK;');
    throw e;
  }

  return getInvoiceById(id)!;
};

export const updateInvoiceStatus = (
  invoiceId: string,
  status: InvoiceStatus,
): void => {
  const db = getDatabase();
  db.execute(
    'UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?',
    [status, new Date().toISOString(), invoiceId],
  );
};

/** Record payment against invoice and mark paid when amount covers total. */
/** Parse UI draft rows into validated line inputs; returns null if any row invalid. */
export function parseInvoiceLineDrafts(
  drafts: {description: string; quantity: string; unitPrice: string}[],
): InvoiceLineInput[] | null {
  const lines: InvoiceLineInput[] = [];
  for (const draft of drafts) {
    const description = draft.description.trim();
    if (!description) {
      return null;
    }
    const qty = Number.parseFloat(draft.quantity.replace(',', '.'));
    const unit = Number.parseFloat(draft.unitPrice.replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit < 0) {
      return null;
    }
    lines.push({description, quantity: qty, unitPrice: unit});
  }
  return lines.length > 0 ? lines : null;
}

export function previewInvoiceTotals(
  lines: InvoiceLineInput[],
  vatRate: number = DEFAULT_VAT_RATE,
): {subtotal: number; vatAmount: number; totalAmount: number} {
  return computeTotals(lines, vatRate);
}

export const recordPaymentForInvoice = (
  invoiceId: string,
  amount: number,
  paymentMethod: string,
): string => {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const db = getDatabase();
  const paymentId = uuidv4();
  const now = new Date().toISOString();

  db.execute('BEGIN TRANSACTION;');
  try {
    db.execute(
      `INSERT INTO payments (
        id, patient_id, amount, payment_method, transaction_date, receipt_issued, notes, invoice_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        invoice.patientId,
        amount,
        paymentMethod,
        now,
        0,
        `Payment for invoice ${invoice.invoiceNumber}`,
        invoiceId,
      ],
    );

    const paidResult = db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE invoice_id = ?`,
      [invoiceId],
    ).rows?._array?.[0] as {paid?: number} | undefined;
    const paid = Number(paidResult?.paid ?? 0);

    if (paid >= invoice.totalAmount - 0.01) {
      db.execute(
        'UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?',
        ['paid', now, invoiceId],
      );
    }

    db.execute('COMMIT;');
  } catch (e) {
    db.execute('ROLLBACK;');
    throw e;
  }

  return paymentId;
};
