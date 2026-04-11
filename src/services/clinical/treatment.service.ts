/**
 * Treatment & dental chart persistence.
 * Chart conditions use TOOTH_CONDITIONS; treatments ↔ chart stay in sync via recordTreatment().
 * Transactions use QuickSQLiteConnection.transaction() from react-native-quick-sqlite (via getDatabase()).
 *
 * Notes: SQLite TEXT is UTF-8. Greek (and any Unicode) in `notes` is passed through as a JavaScript
 * string and stored without loss by the native driver.
 */

import {getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';

/**
 * dental_chart.condition values — identical to menu/legend wording (no aliases).
 * Menu "Extraction" maps to MISSING here (chart/legend show Missing).
 */
export const TOOTH_CONDITIONS = {
  CLEANING: 'Cleaning',
  CARIES: 'Caries',
  FILLING: 'Filling',
  ROOT_CANAL: 'Root Canal',
  POST_CORE: 'Post & Core',
  CROWN: 'Crown',
  BRIDGE: 'Bridge',
  IMPLANT: 'Implant',
  GINGIVECTOMY: 'Gingivectomy',
  MISSING: 'Missing',
} as const;

export type ToothCondition =
  (typeof TOOTH_CONDITIONS)[keyof typeof TOOTH_CONDITIONS];

/** Stored procedure_type values for per-tooth (site) treatments — exact order, no extras. */
export const TOOTH_SITE_PROCEDURE_VALUES = [
  'Caries / Filling (\u03A3\u03C6\u03C1\u03AC\u03B3\u03B9\u03C3\u03BC\u03B1)',
  'Root Canal (\u0395\u03BD\u03B4\u03BF\u03B4\u03BF\u03BD\u03C4\u03B9\u03BA\u03AE \u0398\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1)',
  'Extraction (\u0395\u03BE\u03B1\u03B3\u03C9\u03B3\u03AE)',
  'Crown (\u03A3\u03C4\u03B5\u03C6\u03AC\u03BD\u03B7)',
  'Bridge (\u0393\u03AD\u03C6\u03C5\u03C1\u03B1)',
  'Implant (\u0395\u03BC\u03C6\u03CD\u03C4\u03B5\u03C5\u03BC\u03B1)',
  'Post & Core (\u0386\u03BE\u03BF\u03BD\u03B1\u03C2)',
  'Gingivectomy (\u039F\u03C5\u03BB\u03B5\u03BA\u03C4\u03BF\u03BC\u03AE)',
] as const;

/** Full-mouth / non–tooth-specific procedures — never written to dental_chart. */
export const GENERAL_PROCEDURE_VALUES = [
  'Cleaning / Scaling (\u039A\u03B1\u03B8\u03B1\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2 / \u0391\u03C0\u03BF\u03C4\u03C1\u03CD\u03B3\u03C9\u03C3\u03B7)',
  'Consultation / Exam (\u039A\u03BB\u03B9\u03BD\u03B9\u03BA\u03AE \u0395\u03BE\u03AD\u03C4\u03B1\u03C3\u03B7 / \u03A3\u03C7\u03AD\u03B4\u03B9\u03BF \u0398\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1\u03C2)',
  'Panoramic X-Ray (\u03A0\u03B1\u03BD\u03BF\u03C1\u03B1\u03BC\u03B9\u03BA\u03AE)',
  'Teeth Whitening (\u039B\u03B5\u03CD\u03BA\u03B1\u03BD\u03C3\u03B7)',
  'Night Guard (\u039D\u03AC\u03C1\u03B8\u03B7\u03BA\u03B1\u03C2 \u0392\u03C1\u03C5\u03B3\u03BC\u03BF\u03CD)',
  'Periodontal Treatment (\u0398\u03B5\u03C1\u03B1\u03C0\u03B5\u03AF\u03B1 \u03A0\u03B5\u03C1\u03B9\u03BF\u03B4\u03BF\u03BD\u03C4\u03AF\u03C4\u03B9\u03B4\u03B1\u03C2 - Full Mouth)',
  'Fluoridation (\u03A6\u03B8\u03BF\u03C1\u03AF\u03C9\u03C3\u03B7)',
  'Emergency Visit (\u0388\u03BA\u03C4\u03B1\u03BA\u03C4\u03BF \u03A0\u03B5\u03C1\u03B9\u03C3\u03C4\u03B1\u03C4\u03B9\u03BA\u03CC)',
] as const;

export const TOOTH_SITE_PROCEDURE_SET = new Set<string>(TOOTH_SITE_PROCEDURE_VALUES);
export const GENERAL_PROCEDURE_SET = new Set<string>(GENERAL_PROCEDURE_VALUES);

/** Legacy single-tooth labels still found in older rows */
const LEGACY_SITE_PROCEDURE_VALUES = [
  'Caries',
  'Filling',
  'Root Canal',
  'Crown',
  'Bridge',
  'Extraction',
  'Crown / Bridge',
  'Crown / Bridge (\u03A3\u03C4\u03B5\u03C6\u03AC\u03BD\u03B7 / \u0393\u03AD\u03C6\u03C5\u03C1\u03B1)',
  'Gingivectomy',
  'Gingivectomy (\u039F\u03C5\u03BB\u03B5\u03BA\u03C4\u03BF\u03BC\u03AE - \u03B1\u03BD\u03AC \u03B4\u03CC\u03BD\u03C4\u03B9)',
  'Post & Core',
  'Post & Core (\u0386\u03BE\u03BF\u03BD\u03B1\u03C2)',
] as const;

/** SQL IN-list: procedures that may drive dental_chart for a tooth */
function sqlQuotedSiteProcedureInList(): string {
  const all = [
    ...TOOTH_SITE_PROCEDURE_VALUES,
    ...LEGACY_SITE_PROCEDURE_VALUES,
  ];
  return all.map((s) => `'${String(s).replace(/'/g, "''")}'`).join(', ');
}

/** English / bilingual prefix before optional " (Greek…)" */
export function procedureDisplayBase(procedureType: string): string {
  const t = procedureType.trim();
  const idx = t.indexOf(' (');
  if (idx === -1) {
    return t;
  }
  return t.slice(0, idx).trim();
}

const GENERAL_BASE_LABELS = new Set(
  GENERAL_PROCEDURE_VALUES.map((v) => procedureDisplayBase(v)),
);

/** True if this procedure should never set dental_chart (general visit). */
export function isGeneralProcedureType(
  procedureType: string | null | undefined,
): boolean {
  if (procedureType == null || String(procedureType).trim() === '') {
    return false;
  }
  const t = String(procedureType).trim();
  if (GENERAL_PROCEDURE_SET.has(t)) {
    return true;
  }
  const base = procedureDisplayBase(t);
  if (GENERAL_BASE_LABELS.has(base)) {
    return true;
  }
  if (base === 'Cleaning' || t === 'Cleaning') {
    return true;
  }
  return false;
}

/** Per-tooth chart storage: site-specific conditions only (not full-mouth Cleaning). */
const CHART_SITE_CONDITION_SET = new Set<string>([
  TOOTH_CONDITIONS.CARIES,
  TOOTH_CONDITIONS.FILLING,
  TOOTH_CONDITIONS.ROOT_CANAL,
  TOOTH_CONDITIONS.POST_CORE,
  TOOTH_CONDITIONS.CROWN,
  TOOTH_CONDITIONS.BRIDGE,
  TOOTH_CONDITIONS.IMPLANT,
  TOOTH_CONDITIONS.GINGIVECTOMY,
  TOOTH_CONDITIONS.MISSING,
]);

const ALL_DISPLAY_CONDITIONS = new Set<string>(Object.values(TOOTH_CONDITIONS));

/** Default chart cell when unknown or empty (should not occur after DB migration). */
export function coerceToothCondition(
  raw: string | null | undefined,
): ToothCondition {
  if (raw == null || String(raw).trim() === '') {
    return TOOTH_CONDITIONS.CLEANING;
  }
  const t = String(raw).trim();
  if (t === 'Crown / Bridge') {
    return TOOTH_CONDITIONS.CROWN;
  }
  if (t === 'BRIDGE') {
    return TOOTH_CONDITIONS.BRIDGE;
  }
  if (t === 'Gingivectomy') {
    return TOOTH_CONDITIONS.GINGIVECTOMY;
  }
  if (t === 'POST_CORE' || t === 'POST CORE') {
    return TOOTH_CONDITIONS.POST_CORE;
  }
  if (ALL_DISPLAY_CONDITIONS.has(t)) {
    return t as ToothCondition;
  }
  return TOOTH_CONDITIONS.CLEANING;
}

export interface RecordTreatmentInput {
  patientId: string;
  appointmentId?: string | null;
  toothNumber?: number | null;
  surface?: string | null;
  serviceId?: string | null;
  cost?: number | null;
  notes?: string | null;
  createdAt?: string;
  /**
   * Clinical procedure label, e.g. 'Extraction', 'Filling', 'Root Canal'.
   * Drives automatic dental_chart upsert when a tooth number is set.
   */
  treatmentType: string;
  /**
   * Optional override for chart condition when treatmentType alone is ambiguous.
   */
  chartConditionOverride?: ToothCondition | null;
}

/** Fields that may be updated on an existing treatment row */
export interface UpdateTreatmentInput {
  patientId: string;
  treatmentType: string;
  notes: string | null;
  cost: number | null;
}

type SqlExecResult = {
  rows?: {_array?: Record<string, unknown>[]};
};

type SqlTx = {
  execute: (sql: string, params?: unknown[]) => SqlExecResult;
};

/**
 * Sets dental_chart for one tooth from the newest treatment row for that tooth,
 * or removes the chart row if there are no treatments left.
 */
function syncDentalChartToLatestTreatmentForTooth(
  tx: SqlTx,
  patientId: string,
  toothNumber: number,
  updatedAt: string,
): void {
  const siteInList = sqlQuotedSiteProcedureInList();
  const latest = tx.execute(
    `SELECT procedure_type FROM treatments
     WHERE patient_id = ? AND tooth_number = ?
       AND procedure_type IS NOT NULL
       AND TRIM(procedure_type) != ''
       AND procedure_type IN (${siteInList})
     ORDER BY datetime(created_at) DESC, created_at DESC
     LIMIT 1`,
    [patientId, toothNumber],
  );
  const row = (latest.rows?._array as Record<string, unknown>[] | undefined)?.[0];
  if (!row) {
    tx.execute(
      `DELETE FROM dental_chart WHERE patient_id = ? AND tooth_number = ?`,
      [patientId, toothNumber],
    );
    return;
  }
  const procedureType =
    row.procedure_type != null ? String(row.procedure_type) : '';
  const chartCondition = conditionFromTreatmentType(procedureType, undefined);
  if (chartCondition === null) {
    tx.execute(
      `DELETE FROM dental_chart WHERE patient_id = ? AND tooth_number = ?`,
      [patientId, toothNumber],
    );
    return;
  }
  const chartId = uuidv4();
  tx.execute(
    `INSERT INTO dental_chart (id, patient_id, tooth_number, condition, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(patient_id, tooth_number) DO UPDATE SET
       condition = excluded.condition,
       updated_at = excluded.updated_at`,
    [chartId, patientId, toothNumber, chartCondition, updatedAt],
  );
}

export interface TreatmentRow {
  id: string;
  patientId: string;
  appointmentId: string | null;
  toothNumber: number | null;
  surface: string | null;
  serviceId: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  /** Clinical label for reporting (Module K), e.g. "Filling" */
  procedureType: string | null;
}

export interface DentalChartRow {
  id: string;
  patientId: string;
  toothNumber: number;
  /** Stored value matches TOOTH_CONDITIONS string literals */
  condition: string;
  updatedAt: string;
}

/** One treatment line plus optional appointment context for clinical timeline UI */
export interface ClinicalHistoryRow extends TreatmentRow {
  appointmentDate: string | null;
  appointmentStartTime: string | null;
  appointmentEndTime: string | null;
  appointmentType: string | null;
  appointmentStatus: string | null;
}

function conditionFromTreatmentType(
  treatmentType: string,
  override: ToothCondition | null | undefined,
): ToothCondition | null {
  if (override != null && String(override).trim() !== '') {
    const o = String(override).trim();
    if (o === TOOTH_CONDITIONS.CLEANING) {
      return null;
    }
    return o as ToothCondition;
  }
  const t = treatmentType.trim();
  if (isGeneralProcedureType(t)) {
    return null;
  }
  if (t === TOOTH_CONDITIONS.CLEANING) {
    return null;
  }

  const base = procedureDisplayBase(t);

  const siteByBase: Record<string, ToothCondition> = {
    'Caries / Filling': TOOTH_CONDITIONS.FILLING,
    'Root Canal': TOOTH_CONDITIONS.ROOT_CANAL,
    Extraction: TOOTH_CONDITIONS.MISSING,
    Crown: TOOTH_CONDITIONS.CROWN,
    Bridge: TOOTH_CONDITIONS.BRIDGE,
    Implant: TOOTH_CONDITIONS.IMPLANT,
    'Post & Core': TOOTH_CONDITIONS.POST_CORE,
    Gingivectomy: TOOTH_CONDITIONS.GINGIVECTOMY,
    'Crown / Bridge': TOOTH_CONDITIONS.CROWN,
    Caries: TOOTH_CONDITIONS.CARIES,
    Filling: TOOTH_CONDITIONS.FILLING,
  };
  const fromBase = siteByBase[base];
  if (fromBase != null) {
    return fromBase;
  }

  if (CHART_SITE_CONDITION_SET.has(t)) {
    return t as ToothCondition;
  }
  return null;
}

/** True if stored chart value means the tooth is not present. */
function isMissingStoredCondition(condition: string): boolean {
  const c = condition.trim();
  return (
    c === TOOTH_CONDITIONS.MISSING ||
    c === 'MISSING' ||
    c === 'MISSING_TOOTH'
  );
}

function normalizeToothNumberColumn(
  value: unknown,
): number | null {
  if (value == null || value === '') {
    return null;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n === 0) {
    return null;
  }
  return n;
}

function mapTreatmentRow(row: Record<string, unknown>): TreatmentRow {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    appointmentId:
      row.appointment_id != null ? String(row.appointment_id) : null,
    toothNumber: normalizeToothNumberColumn(row.tooth_number),
    surface: row.surface != null ? String(row.surface) : null,
    serviceId: row.service_id != null ? String(row.service_id) : null,
    cost: row.cost != null ? Number(row.cost) : null,
    notes: row.notes != null ? String(row.notes) : null,
    createdAt: String(row.created_at),
    procedureType:
      row.procedure_type != null ? String(row.procedure_type) : null,
  };
}

function mapDentalChartRow(row: Record<string, unknown>): DentalChartRow {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    toothNumber: Number(row.tooth_number),
    condition: String(row.condition),
    updatedAt: String(row.updated_at),
  };
}

function mapClinicalHistoryRow(row: Record<string, unknown>): ClinicalHistoryRow {
  const base = mapTreatmentRow(row);
  return {
    ...base,
    appointmentDate:
      row.appointment_date != null ? String(row.appointment_date) : null,
    appointmentStartTime:
      row.appointment_start_time != null
        ? String(row.appointment_start_time)
        : null,
    appointmentEndTime:
      row.appointment_end_time != null
        ? String(row.appointment_end_time)
        : null,
    appointmentType:
      row.appointment_type != null ? String(row.appointment_type) : null,
    appointmentStatus:
      row.appointment_status != null
        ? String(row.appointment_status)
        : null,
  };
}

/**
 * Inserts a treatment and upserts dental_chart for the same tooth inside one transaction.
 * If the chart upsert throws, the treatment insert is rolled back.
 */
export const recordTreatment = async (
  treatmentData: RecordTreatmentInput,
): Promise<TreatmentRow> => {
  const db = getDatabase();
  const id = uuidv4();
  const createdAt = treatmentData.createdAt ?? new Date().toISOString();
  const toothNumber =
    treatmentData.toothNumber !== undefined &&
    treatmentData.toothNumber !== null
      ? treatmentData.toothNumber
      : null;

  const chartCondition = conditionFromTreatmentType(
    treatmentData.treatmentType,
    treatmentData.chartConditionOverride,
  );

  await db.transaction(async (tx) => {
    tx.execute(
      `INSERT INTO treatments (
        id, patient_id, appointment_id, tooth_number, surface, service_id, cost, notes, created_at, procedure_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        treatmentData.patientId,
        treatmentData.appointmentId ?? null,
        toothNumber,
        treatmentData.surface ?? null,
        treatmentData.serviceId ?? null,
        treatmentData.cost ?? null,
        treatmentData.notes ?? null,
        createdAt,
        treatmentData.treatmentType,
      ],
    );

    if (toothNumber !== null && chartCondition !== null) {
      const chartId = uuidv4();
      tx.execute(
        `INSERT INTO dental_chart (id, patient_id, tooth_number, condition, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(patient_id, tooth_number) DO UPDATE SET
           condition = excluded.condition,
           updated_at = excluded.updated_at`,
        [chartId, treatmentData.patientId, toothNumber, chartCondition, createdAt],
      );
    }
  });

  return {
    id,
    patientId: treatmentData.patientId,
    appointmentId: treatmentData.appointmentId ?? null,
    toothNumber,
    surface: treatmentData.surface ?? null,
    serviceId: treatmentData.serviceId ?? null,
    cost: treatmentData.cost ?? null,
    notes: treatmentData.notes ?? null,
    createdAt,
    procedureType: treatmentData.treatmentType,
  };
};

/** @deprecated Use recordTreatment */
export const addTreatment = (
  data: RecordTreatmentInput,
): Promise<TreatmentRow> => recordTreatment(data);

/**
 * Updates an existing treatment and resyncs dental_chart from the newest treatment for that tooth.
 */
export const updateTreatment = async (
  id: string,
  data: UpdateTreatmentInput,
): Promise<TreatmentRow> => {
  const db = getDatabase();
  const updatedAt = new Date().toISOString();
  await db.transaction(async (tx) => {
    const existing = tx.execute(
      `SELECT tooth_number FROM treatments WHERE id = ? AND patient_id = ?`,
      [id, data.patientId],
    );
    const row = (existing.rows?._array as Record<string, unknown>[] | undefined)?.[0];
    if (!row) {
      throw new Error('Treatment not found');
    }
    const toothNumber =
      row.tooth_number != null ? Number(row.tooth_number) : null;
    tx.execute(
      `UPDATE treatments SET procedure_type = ?, notes = ?, cost = ?
       WHERE id = ? AND patient_id = ?`,
      [
        data.treatmentType,
        data.notes ?? null,
        data.cost ?? null,
        id,
        data.patientId,
      ],
    );
    if (toothNumber !== null) {
      syncDentalChartToLatestTreatmentForTooth(
        tx,
        data.patientId,
        toothNumber,
        updatedAt,
      );
    }
  });
  const result = db.execute(
    `SELECT id, patient_id, appointment_id, tooth_number, surface, service_id, cost, notes, created_at, procedure_type
     FROM treatments WHERE id = ?`,
    [id],
  );
  const out = (result.rows?._array as Record<string, unknown>[] | undefined)?.[0];
  if (!out) {
    throw new Error('Treatment not found after update');
  }
  return mapTreatmentRow(out);
};

/**
 * Deletes a treatment row and resyncs dental_chart (or removes the tooth row if none left).
 */
export const deleteTreatment = async (
  id: string,
  patientId: string,
): Promise<void> => {
  const db = getDatabase();
  const updatedAt = new Date().toISOString();
  await db.transaction(async (tx) => {
    const existing = tx.execute(
      `SELECT tooth_number FROM treatments WHERE id = ? AND patient_id = ?`,
      [id, patientId],
    );
    const row = (existing.rows?._array as Record<string, unknown>[] | undefined)?.[0];
    if (!row) {
      throw new Error('Treatment not found');
    }
    const toothNumber =
      row.tooth_number != null ? Number(row.tooth_number) : null;
    tx.execute(`DELETE FROM treatments WHERE id = ? AND patient_id = ?`, [
      id,
      patientId,
    ]);
    if (toothNumber !== null) {
      syncDentalChartToLatestTreatmentForTooth(
        tx,
        patientId,
        toothNumber,
        updatedAt,
      );
    }
  });
};

/** All chart rows for a patient (odontogram state), ordered by tooth number. */
export const getPatientChart = async (
  patientId: string,
): Promise<DentalChartRow[]> => {
  const db = getDatabase();
  const result = db.execute(
    `SELECT id, patient_id, tooth_number, condition, updated_at
     FROM dental_chart
     WHERE patient_id = ?
     ORDER BY tooth_number ASC`,
    [patientId],
  );
  const rows = result.rows?._array ?? [];
  return rows.map((row: Record<string, unknown>) => mapDentalChartRow(row));
};

/**
 * Full clinical log: treatments with optional appointment context, newest first.
 */
export const getPatientHistory = async (
  patientId: string,
): Promise<ClinicalHistoryRow[]> => {
  const db = getDatabase();
  const result = db.execute(
    `SELECT t.id,
       t.patient_id,
       t.appointment_id,
       t.tooth_number,
       t.surface,
       t.service_id,
       t.cost,
       t.notes,
       t.created_at,
       t.procedure_type,
       a.date AS appointment_date,
       a.start_time AS appointment_start_time,
       a.end_time AS appointment_end_time,
       a.type AS appointment_type,
       a.status AS appointment_status
     FROM treatments t
     LEFT JOIN appointments a ON t.appointment_id = a.id
     WHERE t.patient_id = ?
     ORDER BY t.created_at DESC`,
    [patientId],
  );
  const rows = result.rows?._array ?? [];
  return rows.map((row: Record<string, unknown>) => mapClinicalHistoryRow(row));
};

/** Single treatment row by id (scoped to patient). */
export const getTreatmentById = async (
  id: string,
  patientId: string,
): Promise<TreatmentRow | null> => {
  const db = getDatabase();
  const result = db.execute(
    `SELECT id, patient_id, appointment_id, tooth_number, surface, service_id, cost, notes, created_at, procedure_type
     FROM treatments WHERE id = ? AND patient_id = ?`,
    [id, patientId],
  );
  const row = (result.rows?._array as Record<string, unknown>[] | undefined)?.[0];
  return row ? mapTreatmentRow(row) : null;
};

/**
 * UI guard: false if the chart marks this tooth as missing (extraction).
 * No chart row yet ⇒ treat as present (natural dentition not charted).
 */
export const isToothPresent = async (
  patientId: string,
  toothNumber: number,
): Promise<boolean> => {
  const chart = await getPatientChart(patientId);
  const cell = chart.find((r) => r.toothNumber === toothNumber);
  if (!cell) {
    return true;
  }
  return !isMissingStoredCondition(cell.condition);
};
