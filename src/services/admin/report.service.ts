/**
 * Management reporting (Module K): monthly KPIs and receivables.
 */

import {query} from '../database';

export interface ProcedureCount {
  procedureType: string;
  count: number;
}

export interface MonthSummary {
  year: number;
  month: number;
  /** ISO-like key YYYY-MM */
  periodKey: string;
  /** Payments received in the month. */
  revenue: number;
  /** Treatment charges recorded in the month (cost from treatments). */
  charges: number;
  procedures: ProcedureCount[];
  newPatients: number;
}

export interface PendingInvoiceRow {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  firstName: string;
  lastName: string;
  status: string;
  totalAmount: number;
  issueDate: string;
}

export interface ReportsOverview {
  totalReceivables: number;
  pendingInvoiceCount: number;
  pendingInvoiceAmount: number;
  pendingInvoices: PendingInvoiceRow[];
}

export interface OutstandingDebtRow {
  patientId: string;
  firstName: string;
  lastName: string;
  /** Amount the patient still owes (charges − payments). */
  balanceOwed: number;
}

function monthKey(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}`;
}

function coalesceSum(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Payments received + treatment volume + new patients for a calendar month.
 */
export const getMonthSummary = async (
  month: number,
  year: number,
): Promise<MonthSummary> => {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }
  const periodKey = monthKey(year, month);

  const revenueRows = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
     WHERE substr(transaction_date, 1, 7) = ?`,
    [periodKey],
  );
  const revenue = coalesceSum(revenueRows[0]?.total);

  const chargeRows = await query(
    `SELECT COALESCE(SUM(cost), 0) AS total FROM treatments
     WHERE substr(created_at, 1, 7) = ?`,
    [periodKey],
  );
  const charges = coalesceSum(chargeRows[0]?.total);

  const procRows = await query(
    `SELECT COALESCE(procedure_type, 'Unspecified') AS procedure_type, COUNT(*) AS cnt
     FROM treatments
     WHERE substr(created_at, 1, 7) = ?
     GROUP BY COALESCE(procedure_type, 'Unspecified')
     ORDER BY cnt DESC`,
    [periodKey],
  );

  const procedures: ProcedureCount[] = procRows.map((r: Record<string, unknown>) => ({
    procedureType: String(r.procedure_type),
    count: Number(r.cnt) || 0,
  }));

  const newPatientRows = await query(
    `SELECT COUNT(*) AS cnt FROM patients
     WHERE substr(created_at, 1, 7) = ?`,
    [periodKey],
  );
  const newPatients = Number(newPatientRows[0]?.cnt) || 0;

  return {
    year,
    month,
    periodKey,
    revenue,
    charges,
    procedures,
    newPatients,
  };
};

/**
 * Open invoices (draft or issued, not paid/cancelled) and practice-wide receivables.
 */
export const getReportsOverview = async (
  pendingLimit: number = 20,
): Promise<ReportsOverview> => {
  const pendingRows = await query(
    `SELECT i.id, i.invoice_number, i.patient_id, i.status, i.total_amount, i.issue_date,
            p.first_name, p.last_name
     FROM invoices i
     INNER JOIN patients p ON p.id = i.patient_id
     WHERE i.status IN ('draft', 'issued')
     ORDER BY i.issue_date DESC, i.created_at DESC
     LIMIT ?`,
    [pendingLimit],
  );

  const pendingInvoices: PendingInvoiceRow[] = pendingRows.map(
    (r: Record<string, unknown>) => ({
      invoiceId: String(r.id),
      invoiceNumber: String(r.invoice_number),
      patientId: String(r.patient_id),
      firstName: String(r.first_name),
      lastName: String(r.last_name),
      status: String(r.status),
      totalAmount: Number(r.total_amount) || 0,
      issueDate: String(r.issue_date ?? ''),
    }),
  );

  const sumRows = await query(
    `SELECT COUNT(*) AS cnt, COALESCE(SUM(total_amount), 0) AS total
     FROM invoices WHERE status IN ('draft', 'issued')`,
    [],
  );
  const pendingInvoiceCount = Number(sumRows[0]?.cnt) || 0;
  const pendingInvoiceAmount = coalesceSum(sumRows[0]?.total);

  const recvRows = await query(
    `SELECT COALESCE(SUM(CASE WHEN bal > 0.005 THEN bal ELSE 0 END), 0) AS total FROM (
       SELECT COALESCE((SELECT SUM(t.cost) FROM treatments t WHERE t.patient_id = p.id), 0)
            - COALESCE((SELECT SUM(pay.amount) FROM payments pay WHERE pay.patient_id = p.id), 0) AS bal
       FROM patients p
     ) AS balances`,
    [],
  );
  const totalReceivables = coalesceSum(recvRows[0]?.total);

  return {
    totalReceivables,
    pendingInvoiceCount,
    pendingInvoiceAmount,
    pendingInvoices,
  };
};

/**
 * Patients with the largest outstanding balances (amount owed to the practice).
 * Sorted descending by balance owed.
 */
export const getOutstandingDebts = async (
  limit: number = 50,
): Promise<OutstandingDebtRow[]> => {
  const rows = await query(
    `SELECT id, first_name, last_name, balance FROM (
       SELECT p.id,
              p.first_name,
              p.last_name,
              (COALESCE((SELECT SUM(t.cost) FROM treatments t WHERE t.patient_id = p.id), 0)
               - COALESCE((SELECT SUM(pay.amount) FROM payments pay WHERE pay.patient_id = p.id), 0)
              ) AS balance
       FROM patients p
     ) AS x WHERE balance > 0.005
     ORDER BY balance DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((r: Record<string, unknown>) => ({
    patientId: String(r.id),
    firstName: String(r.first_name),
    lastName: String(r.last_name),
    balanceOwed: Number(r.balance) || 0,
  }));
};
