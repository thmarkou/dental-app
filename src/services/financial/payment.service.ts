/**
 * Patient payments, balances, and ledger (pre–myDATA helpers).
 * All reads/writes use getDatabase().execute (react-native-quick-sqlite).
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export interface RecordPaymentInput {
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  transactionDate?: string;
  notes?: string | null;
  /** Greek compliance: receipt issued */
  receiptIssued?: boolean;
}

export interface PaymentRow {
  id: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  receiptIssued: boolean;
  notes: string | null;
  /** AADE / myDATA submission reference when recorded */
  mydataMark: string | null;
}

export type LedgerEntryKind = 'debit' | 'credit';

/** Unified statement line: treatment charge (debit) or payment (credit). */
export interface LedgerEntry {
  kind: LedgerEntryKind;
  id: string;
  occurredAt: string;
  amount: number;
  /** Short description for the secretary UI */
  description: string;
  paymentMethod: string | null;
  receiptIssued: boolean | null;
  notes: string | null;
  toothNumber: number | null;
  /** Present for payment (credit) lines after myDATA simulation */
  mydataMark?: string | null;
}

export interface DailyTotalByMethod {
  paymentMethod: string;
  total: number;
}

/** One row for accountant CSV (current calendar month on device). */
export interface MonthlyPaymentReportRow {
  paymentId: string;
  patientId: string;
  firstName: string;
  lastName: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  receiptIssued: boolean;
  notes: string | null;
  mydataMark: string | null;
}

/** Recent payment with patient display name (global cash register list). */
export interface RecentPaymentWithPatientRow {
  paymentId: string;
  patientId: string;
  firstName: string;
  lastName: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  receiptIssued: boolean;
}

function todayLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function coalesceSum(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Amount the patient still owes: SUM(treatment costs) − SUM(payments).
 * Returns 0 when there are no rows or only null costs.
 */
export const getPatientBalance = (patientId: string): number => {
  const db = getDatabase();

  const chargesResult = db.execute(
    `SELECT COALESCE(SUM(cost), 0) AS total FROM treatments WHERE patient_id = ?`,
    [patientId],
  );
  const creditsResult = db.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE patient_id = ?`,
    [patientId],
  );

  const charges = coalesceSum(chargesResult.rows?._array?.[0]?.total);
  const credits = coalesceSum(creditsResult.rows?._array?.[0]?.total);

  return charges - credits;
};

export const recordPayment = (paymentData: RecordPaymentInput): PaymentRow => {
  const db = getDatabase();
  const id = uuidv4();
  const transactionDate =
    paymentData.transactionDate ?? new Date().toISOString();
  const receiptIssued = paymentData.receiptIssued === true ? 1 : 0;
  const notes = paymentData.notes ?? null;

  db.execute(
    `INSERT INTO payments (
      id, patient_id, amount, payment_method, transaction_date, receipt_issued, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      paymentData.patientId,
      paymentData.amount,
      String(paymentData.paymentMethod),
      transactionDate,
      receiptIssued,
      notes,
    ],
  );

  return {
    id,
    patientId: paymentData.patientId,
    amount: paymentData.amount,
    paymentMethod: String(paymentData.paymentMethod),
    transactionDate,
    receiptIssued: receiptIssued === 1,
    notes,
    mydataMark: null,
  };
};

function mapPaymentRow(row: Record<string, unknown>): PaymentRow {
  const receipt =
    row.receipt_issued != null ? Number(row.receipt_issued) === 1 : false;
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    amount: row.amount != null ? Number(row.amount) : 0,
    paymentMethod: String(row.payment_method),
    transactionDate: String(row.transaction_date),
    receiptIssued: receipt,
    notes: row.notes != null ? String(row.notes) : null,
    mydataMark:
      row.mydata_mark != null && String(row.mydata_mark).trim() !== ''
        ? String(row.mydata_mark)
        : null,
  };
}

/**
 * Load a single payment row (for myDATA and detail views).
 */
export const getPaymentById = (paymentId: string): PaymentRow | null => {
  const db = getDatabase();
  const row = db.execute(
    `SELECT id, patient_id, amount, payment_method, transaction_date, receipt_issued, notes, mydata_mark
     FROM payments WHERE id = ?`,
    [paymentId],
  ).rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return mapPaymentRow(row);
};

/**
 * After simulated myDATA submission: store mark and mark receipt as issued.
 */
export const applyMyDataSubmission = (
  paymentId: string,
  mydataMark: string,
): void => {
  const db = getDatabase();
  db.execute(
    `UPDATE payments SET mydata_mark = ?, receipt_issued = 1 WHERE id = ?`,
    [mydataMark, paymentId],
  );
};

/**
 * Payments in a given `YYYY-MM` bucket (local SQLite strftime on stored dates).
 */
export const getMonthlyPaymentReportRows = (
  yearMonth: string,
): MonthlyPaymentReportRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT p.id AS id, p.patient_id AS patient_id, pat.first_name AS first_name, pat.last_name AS last_name,
              p.amount AS amount, p.payment_method AS payment_method, p.transaction_date AS transaction_date,
              p.receipt_issued AS receipt_issued, p.notes AS notes, p.mydata_mark AS mydata_mark
       FROM payments p
       INNER JOIN patients pat ON pat.id = p.patient_id
       WHERE strftime('%Y-%m', p.transaction_date) = ?
       ORDER BY p.transaction_date ASC`,
      [yearMonth],
    ).rows?._array ?? [];

  return rows.map((r: Record<string, unknown>) => ({
    paymentId: String(r.id),
    patientId: String(r.patient_id),
    firstName: String(r.first_name ?? ''),
    lastName: String(r.last_name ?? ''),
    amount: r.amount != null ? Number(r.amount) : 0,
    paymentMethod: String(r.payment_method ?? ''),
    transactionDate: String(r.transaction_date ?? ''),
    receiptIssued:
      r.receipt_issued != null ? Number(r.receipt_issued) === 1 : false,
    notes: r.notes != null ? String(r.notes) : null,
    mydataMark:
      r.mydata_mark != null && String(r.mydata_mark).trim() !== ''
        ? String(r.mydata_mark)
        : null,
  }));
};

function mapLedgerDebit(row: Record<string, unknown>): LedgerEntry {
  const cost = row.cost != null ? Number(row.cost) : 0;
  const tooth = row.tooth_number != null ? Number(row.tooth_number) : null;
  const note = row.notes != null ? String(row.notes) : null;
  return {
    kind: 'debit',
    id: String(row.id),
    occurredAt: String(row.created_at),
    amount: Number.isFinite(cost) ? cost : 0,
    description:
      tooth != null ? `Treatment (tooth ${tooth})` : 'Treatment',
    paymentMethod: null,
    receiptIssued: null,
    notes: note,
    toothNumber: tooth,
  };
}

function mapLedgerCredit(row: Record<string, unknown>): LedgerEntry {
  const amt = row.amount != null ? Number(row.amount) : 0;
  const receipt =
    row.receipt_issued != null ? Number(row.receipt_issued) === 1 : false;
  const mark =
    row.mydata_mark != null && String(row.mydata_mark).trim() !== ''
      ? String(row.mydata_mark)
      : null;
  return {
    kind: 'credit',
    id: String(row.id),
    occurredAt: String(row.transaction_date),
    amount: Number.isFinite(amt) ? amt : 0,
    description: `Payment (${String(row.payment_method)})`,
    paymentMethod: String(row.payment_method),
    receiptIssued: receipt,
    notes: row.notes != null ? String(row.notes) : null,
    toothNumber: null,
    mydataMark: mark,
  };
}

/**
 * Chronological account statement: debits (treatments) and credits (payments), oldest first.
 */
export const getPatientLedger = (patientId: string): LedgerEntry[] => {
  const db = getDatabase();

  const treatmentRows =
    db.execute(
      `SELECT id, patient_id, cost, notes, tooth_number, created_at
       FROM treatments
       WHERE patient_id = ?
       ORDER BY created_at ASC`,
      [patientId],
    ).rows?._array ?? [];

  const paymentRows =
    db.execute(
      `SELECT id, patient_id, amount, payment_method, transaction_date, receipt_issued, notes, mydata_mark
       FROM payments
       WHERE patient_id = ?
       ORDER BY transaction_date ASC`,
      [patientId],
    ).rows?._array ?? [];

  const entries: LedgerEntry[] = [
    ...treatmentRows.map((r: Record<string, unknown>) => mapLedgerDebit(r)),
    ...paymentRows.map((r: Record<string, unknown>) => mapLedgerCredit(r)),
  ];

  entries.sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  return entries;
};

/** Alias for callers using the lowercase spelling */
export const getPatientledger = getPatientLedger;

/** Local device calendar month as `YYYY-MM`. */
export function currentYearMonthLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Sum of payment amounts for a calendar month (`YYYY-MM`, device-local interpretation via stored dates). */
export function getMonthlyRevenueEur(yearMonth: string): number {
  const db = getDatabase();
  const row = db.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE strftime('%Y-%m', transaction_date) = ?`,
    [yearMonth],
  ).rows?._array?.[0] as {total?: unknown} | undefined;
  return coalesceSum(row?.total);
}

/** Total EUR still owed across all patients (charges minus payments, only positive balances). */
export function getTotalOutstandingReceivables(): number {
  const db = getDatabase();
  const row = db.execute(
    `SELECT COALESCE(SUM(CASE WHEN bal > 0 THEN bal ELSE 0 END), 0) AS total FROM (
        SELECT COALESCE((SELECT SUM(cost) FROM treatments WHERE patient_id = p.id), 0) -
               COALESCE((SELECT SUM(amount) FROM payments WHERE patient_id = p.id), 0) AS bal
        FROM patients p
      ) AS balances`,
    [],
  ).rows?._array?.[0] as {total?: unknown} | undefined;
  return coalesceSum(row?.total);
}

export function getAppointmentsCountForDate(dateYmd: string): number {
  const db = getDatabase();
  const row = db.execute(
    `SELECT COUNT(*) AS c FROM appointments WHERE date = ?`,
    [dateYmd],
  ).rows?._array?.[0] as {c?: unknown} | undefined;
  const n = row?.c != null ? Number(row.c) : 0;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sums payments for a calendar day (local device date), grouped by payment_method.
 * Defaults to today; pass `YYYY-MM-DD` to query another day.
 */
export const getDailyTotal = (dateYmd?: string): DailyTotalByMethod[] => {
  const db = getDatabase();
  const day = dateYmd ?? todayLocalDateString();

  const result = db.execute(
    `SELECT payment_method AS payment_method, COALESCE(SUM(amount), 0) AS total
     FROM payments
     WHERE date(transaction_date) = date(?)
     GROUP BY payment_method
     ORDER BY payment_method ASC`,
    [day],
  );

  const rows = result.rows?._array ?? [];
  return rows.map((row: Record<string, unknown>) => ({
    paymentMethod: String(row.payment_method),
    total: coalesceSum(row.total),
  }));
};

/**
 * Latest payments across all patients (newest first), for the global transactions view.
 */
export const getRecentPaymentsWithPatient = (
  limit = 40,
): RecentPaymentWithPatientRow[] => {
  const db = getDatabase();
  const cap = Math.min(Math.max(1, limit), 200);
  const rows =
    db.execute(
      `SELECT p.id AS id, p.patient_id AS patient_id, pat.first_name AS first_name, pat.last_name AS last_name,
              p.amount AS amount, p.payment_method AS payment_method, p.transaction_date AS transaction_date,
              p.receipt_issued AS receipt_issued
       FROM payments p
       INNER JOIN patients pat ON pat.id = p.patient_id
       ORDER BY datetime(p.transaction_date) DESC
       LIMIT ?`,
      [cap],
    ).rows?._array ?? [];

  return rows.map((r: Record<string, unknown>) => ({
    paymentId: String(r.id),
    patientId: String(r.patient_id),
    firstName: String(r.first_name ?? ''),
    lastName: String(r.last_name ?? ''),
    amount: r.amount != null ? Number(r.amount) : 0,
    paymentMethod: String(r.payment_method ?? ''),
    transactionDate: String(r.transaction_date ?? ''),
    receiptIssued:
      r.receipt_issued != null ? Number(r.receipt_issued) === 1 : false,
  }));
};
