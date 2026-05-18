/**
 * Treatment plans with phases and planned items (MVP).
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';
import {deleteTreatment, recordTreatment} from './treatment.service';

export type TreatmentPlanStatus =
  | 'draft'
  | 'presented'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PhasePriority = 'urgent' | 'high' | 'medium' | 'low';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';
export type PlanItemStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface TreatmentPlanItemRow {
  id: string;
  phaseId: string;
  procedureType: string;
  toothNumbers: number[];
  description: string | null;
  estimatedCost: number | null;
  estimatedDuration: number;
  status: PlanItemStatus;
  treatmentId: string | null;
  sortOrder: number;
}

export interface TreatmentPlanPhaseRow {
  id: string;
  planId: string;
  phaseNumber: number;
  name: string;
  priority: PhasePriority;
  status: PhaseStatus;
  sortOrder: number;
  items: TreatmentPlanItemRow[];
}

export interface TreatmentPlanRow {
  id: string;
  patientId: string;
  title: string;
  description: string | null;
  status: TreatmentPlanStatus;
  totalEstimatedCost: number;
  createdBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  phases?: TreatmentPlanPhaseRow[];
}

function parseTeethJson(raw: unknown): number[] {
  if (raw == null || String(raw).trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

function teethToJson(teeth: number[] | undefined): string | null {
  if (!teeth?.length) {
    return null;
  }
  return JSON.stringify(teeth);
}

function mapItemRow(row: Record<string, unknown>): TreatmentPlanItemRow {
  return {
    id: String(row.id),
    phaseId: String(row.phase_id),
    procedureType: String(row.procedure_type),
    toothNumbers: parseTeethJson(row.tooth_numbers),
    description: row.description != null ? String(row.description) : null,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    estimatedDuration:
      row.estimated_duration != null ? Number(row.estimated_duration) : 30,
    status: row.status as PlanItemStatus,
    treatmentId: row.treatment_id != null ? String(row.treatment_id) : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
  };
}

function mapPhaseRow(
  row: Record<string, unknown>,
  items: TreatmentPlanItemRow[],
): TreatmentPlanPhaseRow {
  return {
    id: String(row.id),
    planId: String(row.plan_id),
    phaseNumber: Number(row.phase_number),
    name: String(row.name),
    priority: row.priority as PhasePriority,
    status: row.status as PhaseStatus,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    items,
  };
}

function mapPlanRow(row: Record<string, unknown>): TreatmentPlanRow {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    status: row.status as TreatmentPlanStatus,
    totalEstimatedCost:
      row.total_estimated_cost != null ? Number(row.total_estimated_cost) : 0,
    createdBy: row.created_by != null ? String(row.created_by) : null,
    approvedAt: row.approved_at != null ? String(row.approved_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function recalculatePlanTotal(planId: string): number {
  const db = getDatabase();
  const row = db.execute(
    `SELECT COALESCE(SUM(i.estimated_cost), 0) AS total
     FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases p ON p.id = i.phase_id
     WHERE p.plan_id = ? AND i.status != 'cancelled'`,
    [planId],
  ).rows?._array?.[0] as {total?: number} | undefined;
  const total = row?.total != null ? Number(row.total) : 0;
  const now = new Date().toISOString();
  db.execute(
    'UPDATE treatment_plans SET total_estimated_cost = ?, updated_at = ? WHERE id = ?',
    [total, now, planId],
  );
  return total;
}

export const getPatientTreatmentPlans = (
  patientId: string,
): TreatmentPlanRow[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT * FROM treatment_plans WHERE patient_id = ? ORDER BY updated_at DESC`,
      [patientId],
    ).rows?._array ?? [];
  return rows.map((r: Record<string, unknown>) => mapPlanRow(r));
};

export const getTreatmentPlanById = (
  planId: string,
): TreatmentPlanRow | null => {
  const db = getDatabase();
  const planRow = db.execute('SELECT * FROM treatment_plans WHERE id = ?', [
    planId,
  ]).rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!planRow) {
    return null;
  }
  const plan = mapPlanRow(planRow);

  const phaseRows =
    db.execute(
      `SELECT * FROM treatment_plan_phases WHERE plan_id = ? ORDER BY sort_order ASC, phase_number ASC`,
      [planId],
    ).rows?._array ?? [];

  plan.phases = phaseRows.map((pr: Record<string, unknown>) => {
    const phaseId = String(pr.id);
    const itemRows =
      db.execute(
        `SELECT * FROM treatment_plan_items WHERE phase_id = ? ORDER BY sort_order ASC, id ASC`,
        [phaseId],
      ).rows?._array ?? [];
    const items = itemRows.map((ir: Record<string, unknown>) =>
      mapItemRow(ir),
    );
    return mapPhaseRow(pr, items);
  });

  return plan;
};

export interface CreateTreatmentPlanInput {
  patientId: string;
  title: string;
  description?: string | null;
  createdBy?: string | null;
}

export const createTreatmentPlan = (
  input: CreateTreatmentPlanInput,
): TreatmentPlanRow => {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.execute(
    `INSERT INTO treatment_plans (
      id, patient_id, title, description, status, total_estimated_cost,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'draft', 0, ?, ?, ?)`,
    [
      id,
      input.patientId,
      input.title.trim(),
      input.description?.trim() || null,
      input.createdBy ?? null,
      now,
      now,
    ],
  );
  return getTreatmentPlanById(id)!;
};

export const updateTreatmentPlan = (
  planId: string,
  patch: {
    title?: string;
    description?: string | null;
    status?: TreatmentPlanStatus;
  },
): void => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const existing = getTreatmentPlanById(planId);
  if (!existing) {
    throw new Error('Treatment plan not found');
  }

  const title = patch.title?.trim() ?? existing.title;
  const description =
    patch.description !== undefined
      ? patch.description?.trim() || null
      : existing.description;
  const status = patch.status ?? existing.status;
  const approvedAt =
    status === 'approved' && !existing.approvedAt ? now : existing.approvedAt;

  db.execute(
    `UPDATE treatment_plans SET title = ?, description = ?, status = ?,
      approved_at = ?, updated_at = ? WHERE id = ?`,
    [title, description, status, approvedAt, now, planId],
  );
};

interface PlanItemLedgerContext {
  itemId: string;
  patientId: string;
  planTitle: string;
  procedureType: string;
  toothNumbers: number[];
  description: string | null;
  estimatedCost: number | null;
  status: PlanItemStatus;
  treatmentId: string | null;
}

function loadPlanItemLedgerContext(
  itemId: string,
): PlanItemLedgerContext | null {
  const db = getDatabase();
  const row = db.execute(
    `SELECT i.id, i.procedure_type, i.tooth_numbers, i.description,
            i.estimated_cost, i.status, i.treatment_id,
            pl.patient_id, pl.title AS plan_title
     FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
     INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
     WHERE i.id = ?`,
    [itemId],
  ).rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return null;
  }
  return {
    itemId: String(row.id),
    patientId: String(row.patient_id),
    planTitle: String(row.plan_title),
    procedureType: String(row.procedure_type),
    toothNumbers: parseTeethJson(row.tooth_numbers),
    description: row.description != null ? String(row.description) : null,
    estimatedCost:
      row.estimated_cost != null ? Number(row.estimated_cost) : null,
    status: row.status as PlanItemStatus,
    treatmentId:
      row.treatment_id != null ? String(row.treatment_id) : null,
  };
}

function buildPlanItemLedgerNotes(
  planTitle: string,
  description: string | null,
  toothNumbers: number[],
): string {
  const parts = [`\u03A3\u03C7\u03AD\u03B4\u03B9\u03BF: ${planTitle}`];
  if (description?.trim()) {
    parts.push(description.trim());
  }
  if (toothNumbers.length > 1) {
    parts.push(
      `\u0394\u03CC\u03BD\u03C4\u03B9\u03B1: ${toothNumbers.join(', ')}`,
    );
  }
  return parts.join(' \u00B7 ');
}

/**
 * Creates a treatments row (ledger charge) for a completed plan item and links treatment_id.
 * Idempotent when treatment_id is already set.
 */
export const fulfillPlanItemToLedger = async (
  itemId: string,
): Promise<boolean> => {
  const ctx = loadPlanItemLedgerContext(itemId);
  if (!ctx || ctx.status !== 'completed' || ctx.treatmentId) {
    return false;
  }

  const notes = buildPlanItemLedgerNotes(
    ctx.planTitle,
    ctx.description,
    ctx.toothNumbers,
  );
  const toothNumber =
    ctx.toothNumbers.length === 1 ? ctx.toothNumbers[0]! : ctx.toothNumbers[0] ?? null;

  const treatment = await recordTreatment({
    patientId: ctx.patientId,
    toothNumber,
    treatmentType: ctx.procedureType,
    cost: ctx.estimatedCost,
    notes,
  });

  const db = getDatabase();
  db.execute(
    'UPDATE treatment_plan_items SET treatment_id = ? WHERE id = ?',
    [treatment.id, itemId],
  );
  return true;
};

export interface PendingLedgerPostItem {
  id: string;
  procedureType: string;
  estimatedCost: number | null;
  status: PlanItemStatus;
}

export interface PendingLedgerPostSummary {
  items: PendingLedgerPostItem[];
  itemCount: number;
  totalAmount: number;
}

/** Per-plan counts for list UI (which items are on the patient ledger). */
export interface PlanLedgerPostingSummary {
  /** Non-cancelled items in the plan */
  activeItemCount: number;
  /** Items with a linked treatments row (posted charge) */
  postedToLedgerCount: number;
  /** status=completed but not yet on ledger */
  unpostedCompletedCount: number;
}

export const getPlanLedgerPostingSummary = (
  planId: string,
): PlanLedgerPostingSummary => {
  const plan = getTreatmentPlanById(planId);
  if (!plan) {
    return {
      activeItemCount: 0,
      postedToLedgerCount: 0,
      unpostedCompletedCount: 0,
    };
  }

  let activeItemCount = 0;
  let postedToLedgerCount = 0;
  let unpostedCompletedCount = 0;

  for (const phase of plan.phases ?? []) {
    for (const item of phase.items) {
      if (item.status === 'cancelled') {
        continue;
      }
      activeItemCount += 1;
      if (item.treatmentId) {
        postedToLedgerCount += 1;
      }
      if (item.status === 'completed' && !item.treatmentId) {
        unpostedCompletedCount += 1;
      }
    }
  }

  return {activeItemCount, postedToLedgerCount, unpostedCompletedCount};
};

/** Items not yet on the patient ledger (no treatment_id), excluding cancelled. */
export const getPendingLedgerPostsForPlan = (
  planId: string,
): PendingLedgerPostSummary => {
  const plan = getTreatmentPlanById(planId);
  if (!plan) {
    return {items: [], itemCount: 0, totalAmount: 0};
  }

  const items: PendingLedgerPostItem[] = [];
  for (const phase of plan.phases ?? []) {
    for (const item of phase.items) {
      if (item.status === 'cancelled' || item.treatmentId) {
        continue;
      }
      items.push({
        id: item.id,
        procedureType: item.procedureType,
        estimatedCost: item.estimatedCost,
        status: item.status,
      });
    }
  }

  const totalAmount = items.reduce(
    (sum, i) => sum + (i.estimatedCost ?? 0),
    0,
  );
  return {items, itemCount: items.length, totalAmount};
};

export const markAllPlanItemsCompleted = (planId: string): void => {
  const db = getDatabase();
  const plan = getTreatmentPlanById(planId);
  if (!plan) {
    throw new Error('Treatment plan not found');
  }

  for (const phase of plan.phases ?? []) {
    for (const item of phase.items) {
      if (item.status === 'cancelled') {
        continue;
      }
      if (item.status !== 'completed') {
        db.execute(
          'UPDATE treatment_plan_items SET status = ? WHERE id = ?',
          ['completed', item.id],
        );
      }
    }
  }
};

/** Posts ledger charges for completed items only (user must confirm in UI). */
export const postPendingLedgerItemsForPlan = async (
  planId: string,
): Promise<number> => {
  const pending = getPendingLedgerPostsForPlan(planId);
  let posted = 0;
  for (const item of pending.items) {
    if (item.status !== 'completed') {
      continue;
    }
    if (await fulfillPlanItemToLedger(item.id)) {
      posted += 1;
    }
  }
  return posted;
};

/**
 * Marks all non-cancelled items completed, then posts ledger charges (after UI confirm).
 */
export const completeTreatmentPlanAndPostToLedger = async (
  planId: string,
): Promise<number> => {
  markAllPlanItemsCompleted(planId);
  let posted = 0;
  const pending = getPendingLedgerPostsForPlan(planId);
  for (const item of pending.items) {
    if (await fulfillPlanItemToLedger(item.id)) {
      posted += 1;
    }
  }
  return posted;
};

function collectLinkedTreatmentIds(
  rows: Array<Record<string, unknown>>,
): {patientId: string; treatmentIds: string[]} {
  let patientId = '';
  const treatmentIds: string[] = [];
  for (const row of rows) {
    if (!patientId && row.patient_id != null) {
      patientId = String(row.patient_id);
    }
    if (row.treatment_id != null) {
      treatmentIds.push(String(row.treatment_id));
    }
  }
  return {patientId, treatmentIds};
}

async function deleteLinkedLedgerTreatments(
  patientId: string,
  treatmentIds: string[],
): Promise<void> {
  for (const treatmentId of treatmentIds) {
    try {
      await deleteTreatment(treatmentId, patientId);
    } catch {
      // Row may already be gone; continue with plan cleanup.
    }
  }
}

/** Removes plan and any ledger charges created from its items (treatment_id link). */
export const deleteTreatmentPlan = async (planId: string): Promise<void> => {
  const db = getDatabase();
  const linkRows =
    db.execute(
      `SELECT DISTINCT i.treatment_id, pl.patient_id
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE ph.plan_id = ? AND i.treatment_id IS NOT NULL`,
      [planId],
    ).rows?._array ?? [];

  const {patientId, treatmentIds} = collectLinkedTreatmentIds(
    linkRows as Record<string, unknown>[],
  );
  if (patientId && treatmentIds.length > 0) {
    await deleteLinkedLedgerTreatments(patientId, treatmentIds);
  }

  db.execute('DELETE FROM treatment_plans WHERE id = ?', [planId]);
};

export const addTreatmentPlanPhase = (
  planId: string,
  name: string,
  priority: PhasePriority = 'medium',
): TreatmentPlanPhaseRow => {
  const db = getDatabase();
  const countRow = db.execute(
    'SELECT COUNT(*) AS c FROM treatment_plan_phases WHERE plan_id = ?',
    [planId],
  ).rows?._array?.[0] as {c?: number} | undefined;
  const count = countRow?.c != null ? Number(countRow.c) : 0;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO treatment_plan_phases (
      id, plan_id, phase_number, name, priority, status, sort_order
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [id, planId, count + 1, name.trim(), priority, count],
  );
  db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [
    now,
    planId,
  ]);

  return {
    id,
    planId,
    phaseNumber: count + 1,
    name: name.trim(),
    priority,
    status: 'pending',
    sortOrder: count,
    items: [],
  };
};

export const deleteTreatmentPlanPhase = async (phaseId: string): Promise<void> => {
  const db = getDatabase();
  const row = db.execute(
    'SELECT plan_id FROM treatment_plan_phases WHERE id = ?',
    [phaseId],
  ).rows?._array?.[0] as {plan_id?: string} | undefined;

  const linkRows =
    db.execute(
      `SELECT i.treatment_id, pl.patient_id
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE i.phase_id = ? AND i.treatment_id IS NOT NULL`,
      [phaseId],
    ).rows?._array ?? [];

  const {patientId, treatmentIds} = collectLinkedTreatmentIds(
    linkRows as Record<string, unknown>[],
  );
  if (patientId && treatmentIds.length > 0) {
    await deleteLinkedLedgerTreatments(patientId, treatmentIds);
  }

  db.execute('DELETE FROM treatment_plan_phases WHERE id = ?', [phaseId]);
  if (row?.plan_id) {
    recalculatePlanTotal(String(row.plan_id));
    db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      String(row.plan_id),
    ]);
  }
};

export interface AddPlanItemInput {
  phaseId: string;
  procedureType: string;
  toothNumbers?: number[];
  description?: string | null;
  estimatedCost?: number | null;
  estimatedDuration?: number;
}

export const addTreatmentPlanItem = (input: AddPlanItemInput): void => {
  const db = getDatabase();
  const phaseRow = db.execute(
    'SELECT plan_id FROM treatment_plan_phases WHERE id = ?',
    [input.phaseId],
  ).rows?._array?.[0] as {plan_id?: string} | undefined;
  if (!phaseRow?.plan_id) {
    throw new Error('Phase not found');
  }
  const planId = String(phaseRow.plan_id);

  const countRow = db.execute(
    'SELECT COUNT(*) AS c FROM treatment_plan_items WHERE phase_id = ?',
    [input.phaseId],
  ).rows?._array?.[0] as {c?: number} | undefined;
  const sortOrder = countRow?.c != null ? Number(countRow.c) : 0;

  const id = uuidv4();
  db.execute(
    `INSERT INTO treatment_plan_items (
      id, phase_id, procedure_type, tooth_numbers, description,
      estimated_cost, estimated_duration, status, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id,
      input.phaseId,
      input.procedureType.trim(),
      teethToJson(input.toothNumbers),
      input.description?.trim() || null,
      input.estimatedCost ?? null,
      input.estimatedDuration ?? 30,
      sortOrder,
    ],
  );

  recalculatePlanTotal(planId);
  db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    planId,
  ]);
};

export const updateTreatmentPlanItemStatus = (
  itemId: string,
  status: PlanItemStatus,
): void => {
  const db = getDatabase();
  const row = db.execute(
    `SELECT i.phase_id, p.plan_id FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases p ON p.id = i.phase_id
     WHERE i.id = ?`,
    [itemId],
  ).rows?._array?.[0] as {plan_id?: string} | undefined;

  db.execute('UPDATE treatment_plan_items SET status = ? WHERE id = ?', [
    status,
    itemId,
  ]);

  if (row?.plan_id) {
    recalculatePlanTotal(String(row.plan_id));
  }
};

export const deleteTreatmentPlanItem = async (itemId: string): Promise<void> => {
  const db = getDatabase();
  const row = db.execute(
    `SELECT p.plan_id, i.treatment_id, pl.patient_id
     FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases p ON p.id = i.phase_id
     INNER JOIN treatment_plans pl ON pl.id = p.plan_id
     WHERE i.id = ?`,
    [itemId],
  ).rows?._array?.[0] as {
    plan_id?: string;
    treatment_id?: string;
    patient_id?: string;
  } | undefined;

  if (row?.treatment_id && row.patient_id) {
    await deleteLinkedLedgerTreatments(String(row.patient_id), [
      String(row.treatment_id),
    ]);
  }

  db.execute('DELETE FROM treatment_plan_items WHERE id = ?', [itemId]);

  if (row?.plan_id) {
    recalculatePlanTotal(String(row.plan_id));
  }
};

/** Parse user teeth input e.g. "25, 36" or "25" */
export function parseTeethInput(raw: string): number[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 11 && n <= 48);
}
