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

/** Canonical odontogram condition values stored in dental_chart.condition */
export const TOOTH_CONDITIONS = {
  HEALTHY: 'HEALTHY',
  CARIES: 'CARIES',
  FILLING: 'FILLING',
  MISSING: 'MISSING',
  CROWN: 'CROWN',
  ENDO: 'ENDO',
  BRIDGE: 'BRIDGE',
} as const;

export type ToothCondition =
  (typeof TOOTH_CONDITIONS)[keyof typeof TOOTH_CONDITIONS];

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
  /** Stored value should match TOOTH_CONDITIONS; legacy rows may differ until updated */
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

const normalizeTreatmentTypeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

/**
 * Maps normalized treatment type keys to TOOTH_CONDITIONS.
 * Covers common synonyms (Greek/English UI can pass user-facing labels).
 */
const TREATMENT_TYPE_TO_CONDITION: Record<string, ToothCondition> = {
  // Extraction
  extraction: TOOTH_CONDITIONS.MISSING,
  extract: TOOTH_CONDITIONS.MISSING,
  // Fillings
  filling: TOOTH_CONDITIONS.FILLING,
  composite_filling: TOOTH_CONDITIONS.FILLING,
  amalgam_filling: TOOTH_CONDITIONS.FILLING,
  // Endodontics
  root_canal: TOOTH_CONDITIONS.ENDO,
  endo: TOOTH_CONDITIONS.ENDO,
  rct: TOOTH_CONDITIONS.ENDO,
  // Crown & bridge
  crown: TOOTH_CONDITIONS.CROWN,
  bridge: TOOTH_CONDITIONS.BRIDGE,
  // Caries / diagnosis-style entries
  caries: TOOTH_CONDITIONS.CARIES,
  cavity: TOOTH_CONDITIONS.CARIES,
  decay: TOOTH_CONDITIONS.CARIES,
  // Healthy / preventive
  healthy: TOOTH_CONDITIONS.HEALTHY,
  cleaning: TOOTH_CONDITIONS.HEALTHY,
  hygiene: TOOTH_CONDITIONS.HEALTHY,
  prophylaxis: TOOTH_CONDITIONS.HEALTHY,
  checkup: TOOTH_CONDITIONS.HEALTHY,
  check_up: TOOTH_CONDITIONS.HEALTHY,
  examination: TOOTH_CONDITIONS.HEALTHY,
  initial_consultation: TOOTH_CONDITIONS.HEALTHY,
};

function conditionFromTreatmentType(
  treatmentType: string,
  override: ToothCondition | null | undefined,
): ToothCondition | null {
  if (override != null && String(override).trim() !== '') {
    return override;
  }
  const key = normalizeTreatmentTypeKey(treatmentType);
  return TREATMENT_TYPE_TO_CONDITION[key] ?? null;
}

/** True if stored chart value means the tooth is not present (supports legacy lowercase). */
function isMissingStoredCondition(condition: string): boolean {
  const c = condition.trim().toUpperCase();
  return (
    c === TOOTH_CONDITIONS.MISSING ||
    c === 'MISSING' ||
    c === 'MISSING_TOOTH'
  );
}

function mapTreatmentRow(row: Record<string, unknown>): TreatmentRow {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    appointmentId:
      row.appointment_id != null ? String(row.appointment_id) : null,
    toothNumber:
      row.tooth_number != null ? Number(row.tooth_number) : null,
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
