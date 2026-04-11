/**
 * Patient documents (X-rays, consent scans) and GDPR consent (Module J).
 */

import {executeQuery, query, getDatabase} from '../database';
import {uuidv4} from '../../utils/uuid';

export type PatientDocumentType = 'xray' | 'consent' | 'other';

export interface PatientDocumentRow {
  id: string;
  patientId: string;
  documentType: PatientDocumentType;
  title: string | null;
  fileUri: string;
  notes: string | null;
  createdAt: string;
}

export interface AddPatientDocumentInput {
  patientId: string;
  documentType: PatientDocumentType;
  fileUri: string;
  title?: string | null;
  notes?: string | null;
}

function mapDocumentRow(row: Record<string, unknown>): PatientDocumentRow {
  return {
    id: String(row.id),
    patientId: String(row.patient_id),
    documentType: row.document_type as PatientDocumentType,
    title: row.title != null ? String(row.title) : null,
    fileUri: String(row.file_uri),
    notes: row.notes != null ? String(row.notes) : null,
    createdAt: String(row.created_at),
  };
}

/**
 * Register metadata for an on-device file (e.g. from expo-file-system or image picker).
 */
export const addPatientDocument = async (
  input: AddPatientDocumentInput,
): Promise<PatientDocumentRow> => {
  const id = uuidv4();
  const now = new Date().toISOString();
  await executeQuery(
    `INSERT INTO patient_documents (
      id, patient_id, document_type, title, file_uri, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.patientId,
      input.documentType,
      input.title ?? null,
      input.fileUri,
      input.notes ?? null,
      now,
    ],
  );
  return {
    id,
    patientId: input.patientId,
    documentType: input.documentType,
    title: input.title ?? null,
    fileUri: input.fileUri,
    notes: input.notes ?? null,
    createdAt: now,
  };
};

export const getPatientDocuments = async (
  patientId: string,
): Promise<PatientDocumentRow[]> => {
  const rows = await query(
    `SELECT * FROM patient_documents WHERE patient_id = ? ORDER BY created_at DESC`,
    [patientId],
  );
  return rows.map((r) => mapDocumentRow(r as Record<string, unknown>));
};

export const deletePatientDocument = async (documentId: string): Promise<void> => {
  await executeQuery('DELETE FROM patient_documents WHERE id = ?', [documentId]);
};

/**
 * Record or revoke GDPR consent on the patient record (patients.gdpr_consent / gdpr_date).
 */
export const updateGDPRConsent = async (
  patientId: string,
  consentStatus: boolean,
): Promise<void> => {
  const now = new Date().toISOString();
  const consent = consentStatus ? 1 : 0;
  const gdprDate = consentStatus ? now : null;
  await executeQuery(
    `UPDATE patients SET gdpr_consent = ?, gdpr_date = ?, updated_at = ? WHERE id = ?`,
    [consent, gdprDate, now, patientId],
  );
};

/**
 * True when consent flag is set and a consent timestamp exists.
 */
export const isPatientGDPRCompliant = (patientId: string): boolean => {
  const db = getDatabase();
  const result = db.execute(
    `SELECT gdpr_consent, gdpr_date FROM patients WHERE id = ?`,
    [patientId],
  );
  const row = result.rows?._array?.[0] as
    | {gdpr_consent?: number; gdpr_date?: string | null}
    | undefined;
  if (!row) {
    return false;
  }
  const consent = row.gdpr_consent != null && Number(row.gdpr_consent) === 1;
  const hasDate =
    row.gdpr_date != null && String(row.gdpr_date).trim().length > 0;
  return consent && hasDate;
};
