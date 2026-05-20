/**
 * Treatment plans with phases and planned items (MVP).
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';
import {
  deleteTreatment,
  isGeneralProcedureType,
  recordTreatment,
} from './treatment.service';

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
  /** All ledger treatment rows when item spans multiple teeth. */
  treatmentIds: string[];
  sortOrder: number;
}

export interface OpenPlanItemForChart {
  itemId: string;
  planId: string;
  planTitle: string;
  procedureType: string;
  toothNumbers: number[];
  estimatedCost: number | null;
  status: PlanItemStatus;
}

export interface TreatmentPlanPhaseRow {
  id: string;
  planId: string;
  alternativeId: string;
  phaseNumber: number;
  name: string;
  priority: PhasePriority;
  status: PhaseStatus;
  sortOrder: number;
  items: TreatmentPlanItemRow[];
}

export interface TreatmentPlanAlternativeRow {
  id: string;
  planId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  totalEstimatedCost: number;
  isSelected: boolean;
  phases: TreatmentPlanPhaseRow[];
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
  selectedAlternativeId: string | null;
  alternatives?: TreatmentPlanAlternativeRow[];
  /** Phases of the selected alternative (convenience for existing callers). */
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

function parseTreatmentIdsJson(raw: unknown): string[] {
  if (raw == null || String(raw).trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((id) => String(id)).filter((id) => id.length > 0);
  } catch {
    return [];
  }
}

function treatmentIdsToJson(ids: string[]): string | null {
  if (ids.length === 0) {
    return null;
  }
  return JSON.stringify(ids);
}

export function isPlanItemOnLedger(item: Pick<
  TreatmentPlanItemRow,
  'treatmentId' | 'treatmentIds'
>): boolean {
  return !!(item.treatmentId || item.treatmentIds.length > 0);
}

/** Resolves all treatments linked to a plan item (legacy id, JSON array, plan_item_id FK). */
export function getPostedTreatmentIdsForPlanItem(itemId: string): string[] {
  const db = getDatabase();
  const row = db.execute(
    'SELECT treatment_id, treatment_ids FROM treatment_plan_items WHERE id = ?',
    [itemId],
  ).rows?._array?.[0] as Record<string, unknown> | undefined;

  const ids = new Set<string>();
  if (row?.treatment_id != null) {
    ids.add(String(row.treatment_id));
  }
  for (const id of parseTreatmentIdsJson(row?.treatment_ids)) {
    ids.add(id);
  }

  const fkRows =
    db.execute('SELECT id FROM treatments WHERE plan_item_id = ?', [itemId])
      .rows?._array ?? [];
  for (const fr of fkRows as {id?: string}[]) {
    if (fr.id) {
      ids.add(String(fr.id));
    }
  }
  return [...ids];
}

function collectLedgerTreatmentIdsFromItemRows(
  rows: Array<Record<string, unknown>>,
): {patientId: string; treatmentIds: string[]} {
  let patientId = '';
  const treatmentIds = new Set<string>();
  for (const row of rows) {
    if (!patientId && row.patient_id != null) {
      patientId = String(row.patient_id);
    }
    if (row.treatment_id != null) {
      treatmentIds.add(String(row.treatment_id));
    }
    for (const id of parseTreatmentIdsJson(row.treatment_ids)) {
      treatmentIds.add(id);
    }
  }
  return {patientId, treatmentIds: [...treatmentIds]};
}

function collectLedgerTreatmentIdsForPlan(planId: string): {
  patientId: string;
  treatmentIds: string[];
} {
  const db = getDatabase();
  const itemRows =
    db.execute(
      `SELECT i.treatment_id, i.treatment_ids, pl.patient_id
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE ph.plan_id = ?`,
      [planId],
    ).rows?._array ?? [];

  const viaFk =
    db.execute(
      `SELECT t.id AS treatment_id, pl.patient_id
       FROM treatments t
       INNER JOIN treatment_plan_items i ON i.id = t.plan_item_id
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE ph.plan_id = ?`,
      [planId],
    ).rows?._array ?? [];

  const collected = collectLedgerTreatmentIdsFromItemRows(
    itemRows as Record<string, unknown>[],
  );
  const merged = new Set(collected.treatmentIds);
  let resolvedPatientId = collected.patientId;
  for (const row of viaFk as Record<string, unknown>[]) {
    if (!resolvedPatientId && row.patient_id != null) {
      resolvedPatientId = String(row.patient_id);
    }
    if (row.treatment_id != null) {
      merged.add(String(row.treatment_id));
    }
  }
  return {patientId: resolvedPatientId, treatmentIds: [...merged]};
}

export function planProcedureMatchesChart(
  planProcedure: string,
  chartProcedure: string,
): boolean {
  return planProcedure.trim() === chartProcedure.trim();
}

export function findMatchingOpenPlanItems(
  items: OpenPlanItemForChart[],
  toothNumber: number | null,
  procedureType: string,
): OpenPlanItemForChart[] {
  const isGeneral = isGeneralProcedureType(procedureType);
  return items.filter((item) => {
    if (!planProcedureMatchesChart(item.procedureType, procedureType)) {
      return false;
    }
    if (isGeneral) {
      return item.toothNumbers.length === 0;
    }
    if (toothNumber == null) {
      return false;
    }
    return item.toothNumbers.includes(toothNumber);
  });
}

function mapItemRow(row: Record<string, unknown>): TreatmentPlanItemRow {
  const treatmentIds = parseTreatmentIdsJson(row.treatment_ids);
  const treatmentId =
    row.treatment_id != null
      ? String(row.treatment_id)
      : treatmentIds[0] ?? null;
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
    treatmentId,
    treatmentIds,
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
    alternativeId: String(row.alternative_id ?? ''),
    phaseNumber: Number(row.phase_number),
    name: String(row.name),
    priority: row.priority as PhasePriority,
    status: row.status as PhaseStatus,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    items,
  };
}

function mapAlternativeRow(row: Record<string, unknown>): Omit<
  TreatmentPlanAlternativeRow,
  'phases'
> {
  return {
    id: String(row.id),
    planId: String(row.plan_id),
    name: String(row.name),
    description:
      row.description != null && String(row.description).trim() !== ''
        ? String(row.description)
        : null,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    totalEstimatedCost:
      row.total_estimated_cost != null ? Number(row.total_estimated_cost) : 0,
    isSelected: Number(row.is_selected ?? 0) === 1,
  };
}

function loadPhasesForAlternative(
  alternativeId: string,
  planId: string,
): TreatmentPlanPhaseRow[] {
  const db = getDatabase();
  const phaseRows =
    db.execute(
      `SELECT * FROM treatment_plan_phases
       WHERE alternative_id = ? ORDER BY sort_order ASC, phase_number ASC`,
      [alternativeId],
    ).rows?._array ?? [];

  return phaseRows.map((pr: Record<string, unknown>) => {
    const phaseId = String(pr.id);
    const itemRows =
      db.execute(
        `SELECT * FROM treatment_plan_items WHERE phase_id = ? ORDER BY sort_order ASC, id ASC`,
        [phaseId],
      ).rows?._array ?? [];
    const items = itemRows.map((ir: Record<string, unknown>) => mapItemRow(ir));
    const phase = mapPhaseRow(pr, items);
    return {...phase, planId, alternativeId};
  });
}

function loadAlternativesForPlan(planId: string): TreatmentPlanAlternativeRow[] {
  const db = getDatabase();
  const altRows =
    db.execute(
      `SELECT * FROM treatment_plan_alternatives
       WHERE plan_id = ? ORDER BY sort_order ASC, created_at ASC`,
      [planId],
    ).rows?._array ?? [];

  return altRows.map((ar: Record<string, unknown>) => {
    const alt = mapAlternativeRow(ar);
    return {
      ...alt,
      phases: loadPhasesForAlternative(alt.id, planId),
    };
  });
}

export function recalculateAlternativeTotal(alternativeId: string): number {
  const db = getDatabase();
  const row = db.execute(
    `SELECT COALESCE(SUM(i.estimated_cost), 0) AS total
     FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases p ON p.id = i.phase_id
     WHERE p.alternative_id = ? AND i.status != 'cancelled'`,
    [alternativeId],
  ).rows?._array?.[0] as {total?: number} | undefined;
  const total = row?.total != null ? Number(row.total) : 0;
  db.execute(
    'UPDATE treatment_plan_alternatives SET total_estimated_cost = ? WHERE id = ?',
    [total, alternativeId],
  );
  return total;
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
    selectedAlternativeId: null,
  };
}

export function recalculatePlanTotal(planId: string): number {
  const db = getDatabase();
  const altRows =
    db.execute(
      'SELECT id, is_selected FROM treatment_plan_alternatives WHERE plan_id = ?',
      [planId],
    ).rows?._array ?? [];

  let selectedTotal = 0;
  let hasSelected = false;
  for (const ar of altRows as {id?: string; is_selected?: number}[]) {
    const altId = String(ar.id);
    const total = recalculateAlternativeTotal(altId);
    if (Number(ar.is_selected ?? 0) === 1) {
      selectedTotal = total;
      hasSelected = true;
    }
  }

  if (!hasSelected && altRows.length > 0) {
    selectedTotal = recalculateAlternativeTotal(String(altRows[0].id));
  }

  const now = new Date().toISOString();
  db.execute(
    'UPDATE treatment_plans SET total_estimated_cost = ?, updated_at = ? WHERE id = ?',
    [selectedTotal, now, planId],
  );
  return selectedTotal;
}

export const getSelectedAlternativeId = (planId: string): string | null => {
  const db = getDatabase();
  const row = db.execute(
    `SELECT id FROM treatment_plan_alternatives
     WHERE plan_id = ? AND is_selected = 1 LIMIT 1`,
    [planId],
  ).rows?._array?.[0] as {id?: string} | undefined;
  if (row?.id) {
    return String(row.id);
  }
  const fallback = db.execute(
    `SELECT id FROM treatment_plan_alternatives
     WHERE plan_id = ? ORDER BY sort_order ASC LIMIT 1`,
    [planId],
  ).rows?._array?.[0] as {id?: string} | undefined;
  return fallback?.id ? String(fallback.id) : null;
};

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
  plan.alternatives = loadAlternativesForPlan(planId);
  const selected =
    plan.alternatives.find((a) => a.isSelected) ?? plan.alternatives[0] ?? null;
  plan.selectedAlternativeId = selected?.id ?? null;
  plan.phases = selected?.phases ?? [];
  return plan;
};

/** All phases across every alternative (ledger / delete summaries). */
function allPhasesFromPlan(plan: TreatmentPlanRow): TreatmentPlanPhaseRow[] {
  if (plan.alternatives && plan.alternatives.length > 0) {
    return plan.alternatives.flatMap((alt) => alt.phases);
  }
  return plan.phases ?? [];
}

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
  createTreatmentPlanAlternative(id, 'Κύρια επιλογή', null, true);
  return getTreatmentPlanById(id)!;
};

export const createTreatmentPlanAlternative = (
  planId: string,
  name: string,
  description?: string | null,
  selectIt = false,
): TreatmentPlanAlternativeRow => {
  const db = getDatabase();
  const countRow = db.execute(
    'SELECT COUNT(*) AS c FROM treatment_plan_alternatives WHERE plan_id = ?',
    [planId],
  ).rows?._array?.[0] as {c?: number} | undefined;
  const sortOrder = countRow?.c != null ? Number(countRow.c) : 0;
  const id = uuidv4();
  const now = new Date().toISOString();

  if (selectIt) {
    db.execute(
      'UPDATE treatment_plan_alternatives SET is_selected = 0 WHERE plan_id = ?',
      [planId],
    );
  }

  db.execute(
    `INSERT INTO treatment_plan_alternatives (
      id, plan_id, name, description, sort_order, total_estimated_cost,
      is_selected, created_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      planId,
      name.trim(),
      description?.trim() || null,
      sortOrder,
      selectIt ? 1 : 0,
      now,
    ],
  );

  recalculatePlanTotal(planId);
  db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [now, planId]);

  return {
    ...mapAlternativeRow({
      id,
      plan_id: planId,
      name: name.trim(),
      description: description?.trim() || null,
      sort_order: sortOrder,
      total_estimated_cost: 0,
      is_selected: selectIt ? 1 : 0,
    }),
    phases: [],
  };
};

export const updateTreatmentPlanAlternative = (
  alternativeId: string,
  patch: {name?: string; description?: string | null},
): void => {
  const db = getDatabase();
  const row = db.execute(
    'SELECT * FROM treatment_plan_alternatives WHERE id = ?',
    [alternativeId],
  ).rows?._array?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error('Alternative not found');
  }
  const alt = mapAlternativeRow(row);
  db.execute(
    `UPDATE treatment_plan_alternatives SET name = ?, description = ? WHERE id = ?`,
    [
      patch.name?.trim() ?? alt.name,
      patch.description !== undefined
        ? patch.description?.trim() || null
        : alt.description,
      alternativeId,
    ],
  );
  db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    alt.planId,
  ]);
};

export const selectTreatmentPlanAlternative = (
  planId: string,
  alternativeId: string,
): void => {
  const db = getDatabase();
  db.execute(
    'UPDATE treatment_plan_alternatives SET is_selected = 0 WHERE plan_id = ?',
    [planId],
  );
  db.execute(
    'UPDATE treatment_plan_alternatives SET is_selected = 1 WHERE id = ? AND plan_id = ?',
    [alternativeId, planId],
  );
  recalculatePlanTotal(planId);
};

export const deleteTreatmentPlanAlternative = async (
  alternativeId: string,
): Promise<void> => {
  const db = getDatabase();
  const altRow = db.execute(
    'SELECT plan_id FROM treatment_plan_alternatives WHERE id = ?',
    [alternativeId],
  ).rows?._array?.[0] as {plan_id?: string} | undefined;
  if (!altRow?.plan_id) {
    return;
  }
  const planId = String(altRow.plan_id);

  const countRow = db.execute(
    'SELECT COUNT(*) AS c FROM treatment_plan_alternatives WHERE plan_id = ?',
    [planId],
  ).rows?._array?.[0] as {c?: number} | undefined;
  if ((countRow?.c != null ? Number(countRow.c) : 0) <= 1) {
    throw new Error('Cannot delete the only alternative');
  }

  const linkRows =
    db.execute(
      `SELECT i.treatment_id, i.treatment_ids, pl.patient_id
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE ph.alternative_id = ?`,
      [alternativeId],
    ).rows?._array ?? [];

  const {patientId, treatmentIds} = collectLedgerTreatmentIdsFromItemRows(
    linkRows as Record<string, unknown>[],
  );
  const fkRows =
    db.execute(
      `SELECT t.id AS treatment_id, pl.patient_id
       FROM treatments t
       INNER JOIN treatment_plan_items i ON i.id = t.plan_item_id
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE ph.alternative_id = ?`,
      [alternativeId],
    ).rows?._array ?? [];
  const fkCollected = collectLedgerTreatmentIdsFromItemRows(
    fkRows as Record<string, unknown>[],
  );
  const mergedIds = new Set([...treatmentIds, ...fkCollected.treatmentIds]);
  const pid = patientId || fkCollected.patientId;
  if (pid && mergedIds.size > 0) {
    await deleteLinkedLedgerTreatments(pid, [...mergedIds]);
  }

  const wasSelected = db.execute(
    'SELECT is_selected FROM treatment_plan_alternatives WHERE id = ?',
    [alternativeId],
  ).rows?._array?.[0] as {is_selected?: number} | undefined;

  db.execute('DELETE FROM treatment_plan_alternatives WHERE id = ?', [
    alternativeId,
  ]);

  if (Number(wasSelected?.is_selected ?? 0) === 1) {
    const next = db.execute(
      `SELECT id FROM treatment_plan_alternatives
       WHERE plan_id = ? ORDER BY sort_order ASC LIMIT 1`,
      [planId],
    ).rows?._array?.[0] as {id?: string} | undefined;
    if (next?.id) {
      db.execute(
        'UPDATE treatment_plan_alternatives SET is_selected = 1 WHERE id = ?',
        [String(next.id)],
      );
    }
  }

  recalculatePlanTotal(planId);
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
  singleTooth?: number,
): string {
  const parts = [`\u03A3\u03C7\u03AD\u03B4\u03B9\u03BF: ${planTitle}`];
  if (description?.trim()) {
    parts.push(description.trim());
  }
  if (singleTooth != null) {
    parts.push(`\u0394\u03CC\u03BD\u03C4\u03B9: ${singleTooth}`);
  } else if (toothNumbers.length > 1) {
    parts.push(
      `\u0394\u03CC\u03BD\u03C4\u03B9\u03B1: ${toothNumbers.join(', ')}`,
    );
  }
  return parts.join(' \u00B7 ');
}

function splitEstimatedCost(
  total: number | null,
  count: number,
): number | null {
  if (total == null || count <= 0) {
    return null;
  }
  return Math.round((total / count) * 100) / 100;
}

/**
 * Creates one or more treatments rows for a completed plan item (multi-tooth → N charges).
 * Idempotent when already linked. Returns number of new ledger rows created.
 */
export const fulfillPlanItemToLedger = async (
  itemId: string,
): Promise<number> => {
  const ctx = loadPlanItemLedgerContext(itemId);
  if (!ctx || ctx.status !== 'completed') {
    return 0;
  }

  const existing = getPostedTreatmentIdsForPlanItem(itemId);
  if (existing.length > 0) {
    return 0;
  }

  const isGeneral = isGeneralProcedureType(ctx.procedureType);
  const billTargets: (number | null)[] =
    isGeneral || ctx.toothNumbers.length === 0
      ? [null]
      : ctx.toothNumbers;

  const count = billTargets.length;
  const costEach = splitEstimatedCost(ctx.estimatedCost, count);
  const createdIds: string[] = [];

  for (const tooth of billTargets) {
    const notes = buildPlanItemLedgerNotes(
      ctx.planTitle,
      ctx.description,
      ctx.toothNumbers,
      count > 1 && tooth != null ? tooth : undefined,
    );
    const treatment = await recordTreatment({
      patientId: ctx.patientId,
      toothNumber: tooth,
      treatmentType: ctx.procedureType,
      cost: costEach,
      notes,
      planItemId: itemId,
    });
    createdIds.push(treatment.id);
  }

  const db = getDatabase();
  db.execute(
    'UPDATE treatment_plan_items SET treatment_id = ?, treatment_ids = ? WHERE id = ?',
    [
      createdIds[0] ?? null,
      treatmentIdsToJson(createdIds),
      itemId,
    ],
  );
  return createdIds.length;
};

/** Open plan items for odontogram overlay (selected alternative, not yet on ledger). */
export const getOpenPlanItemsForPatient = (
  patientId: string,
): OpenPlanItemForChart[] => {
  const db = getDatabase();
  const rows =
    db.execute(
      `SELECT i.id AS item_id, i.procedure_type, i.tooth_numbers, i.estimated_cost,
              i.status, i.treatment_id, i.treatment_ids,
              pl.id AS plan_id, pl.title AS plan_title
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       INNER JOIN treatment_plan_alternatives alt
         ON alt.id = ph.alternative_id AND alt.is_selected = 1
       WHERE pl.patient_id = ?
         AND pl.status IN ('presented', 'approved', 'in_progress')
         AND i.status IN ('pending', 'scheduled')`,
      [patientId],
    ).rows?._array ?? [];

  const result: OpenPlanItemForChart[] = [];
  for (const row of rows as Record<string, unknown>[]) {
    const itemId = String(row.item_id);
    const hasLedger =
      row.treatment_id != null ||
      parseTreatmentIdsJson(row.treatment_ids).length > 0;
    if (hasLedger) {
      continue;
    }
    result.push({
      itemId,
      planId: String(row.plan_id),
      planTitle: String(row.plan_title),
      procedureType: String(row.procedure_type),
      toothNumbers: parseTeethJson(row.tooth_numbers),
      estimatedCost:
        row.estimated_cost != null ? Number(row.estimated_cost) : null,
      status: row.status as PlanItemStatus,
    });
  }
  return result;
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

  for (const phase of allPhasesFromPlan(plan)) {
    for (const item of phase.items) {
      if (item.status === 'cancelled') {
        continue;
      }
      activeItemCount += 1;
      if (isPlanItemOnLedger(item)) {
        postedToLedgerCount += 1;
      }
      if (item.status === 'completed' && !isPlanItemOnLedger(item)) {
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
  for (const phase of allPhasesFromPlan(plan)) {
    for (const item of phase.items) {
      if (item.status === 'cancelled' || isPlanItemOnLedger(item)) {
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

  for (const phase of allPhasesFromPlan(plan)) {
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
    if ((await fulfillPlanItemToLedger(item.id)) > 0) {
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
    if ((await fulfillPlanItemToLedger(item.id)) > 0) {
      posted += 1;
    }
  }
  return posted;
};

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
  const {patientId, treatmentIds} = collectLedgerTreatmentIdsForPlan(planId);
  if (patientId && treatmentIds.length > 0) {
    await deleteLinkedLedgerTreatments(patientId, treatmentIds);
  }

  db.execute('DELETE FROM treatment_plans WHERE id = ?', [planId]);
};

export const addTreatmentPlanPhase = (
  planId: string,
  name: string,
  priority: PhasePriority = 'medium',
  alternativeId?: string,
): TreatmentPlanPhaseRow => {
  const db = getDatabase();
  const altId = alternativeId ?? getSelectedAlternativeId(planId);
  if (!altId) {
    throw new Error('No treatment plan alternative');
  }

  const countRow = db.execute(
    'SELECT COUNT(*) AS c FROM treatment_plan_phases WHERE alternative_id = ?',
    [altId],
  ).rows?._array?.[0] as {c?: number} | undefined;
  const count = countRow?.c != null ? Number(countRow.c) : 0;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO treatment_plan_phases (
      id, plan_id, alternative_id, phase_number, name, priority, status, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, planId, altId, count + 1, name.trim(), priority, count],
  );
  db.execute('UPDATE treatment_plans SET updated_at = ? WHERE id = ?', [
    now,
    planId,
  ]);
  recalculatePlanTotal(planId);

  return {
    id,
    planId,
    alternativeId: altId,
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
      `SELECT i.treatment_id, i.treatment_ids, pl.patient_id
       FROM treatment_plan_items i
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE i.phase_id = ?`,
      [phaseId],
    ).rows?._array ?? [];

  const {patientId, treatmentIds} = collectLedgerTreatmentIdsFromItemRows(
    linkRows as Record<string, unknown>[],
  );
  const fkRows =
    db.execute(
      `SELECT t.id AS treatment_id, pl.patient_id
       FROM treatments t
       INNER JOIN treatment_plan_items i ON i.id = t.plan_item_id
       INNER JOIN treatment_plan_phases ph ON ph.id = i.phase_id
       INNER JOIN treatment_plans pl ON pl.id = ph.plan_id
       WHERE i.phase_id = ?`,
      [phaseId],
    ).rows?._array ?? [];
  const fkCollected = collectLedgerTreatmentIdsFromItemRows(
    fkRows as Record<string, unknown>[],
  );
  const mergedIds = new Set([...treatmentIds, ...fkCollected.treatmentIds]);
  const pid = patientId || fkCollected.patientId;
  if (pid && mergedIds.size > 0) {
    await deleteLinkedLedgerTreatments(pid, [...mergedIds]);
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
    `SELECT p.plan_id, pl.patient_id
     FROM treatment_plan_items i
     INNER JOIN treatment_plan_phases p ON p.id = i.phase_id
     INNER JOIN treatment_plans pl ON pl.id = p.plan_id
     WHERE i.id = ?`,
    [itemId],
  ).rows?._array?.[0] as {
    plan_id?: string;
    patient_id?: string;
  } | undefined;

  const treatmentIds = getPostedTreatmentIdsForPlanItem(itemId);
  if (row?.patient_id && treatmentIds.length > 0) {
    await deleteLinkedLedgerTreatments(String(row.patient_id), treatmentIds);
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
