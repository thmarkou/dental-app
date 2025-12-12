/**
 * Patient Service
 * CRUD operations for patients
 */

import {query, executeQuery} from '../database';
import {v4 as uuidv4} from 'uuid';
import {Patient, Address, EmergencyContact, InsuranceInfo} from '../../types';

/**
 * Create a new patient
 */
export const createPatient = async (
  patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Patient> => {
  const patientId = uuidv4();
  const now = new Date().toISOString();

  await executeQuery(
    `INSERT INTO patients (
      id, first_name, last_name, date_of_birth, gender, amka, phone, email,
      address_street, address_city, address_postal_code, address_country,
      emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
      occupation, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      patientData.firstName,
      patientData.lastName,
      patientData.dateOfBirth.toISOString(),
      patientData.gender || null,
      patientData.amka || null,
      patientData.phone,
      patientData.email || null,
      patientData.address?.street || null,
      patientData.address?.city || null,
      patientData.address?.postalCode || null,
      patientData.address?.country || 'Greece',
      patientData.emergencyContact?.name || null,
      patientData.emergencyContact?.relationship || null,
      patientData.emergencyContact?.phone || null,
      patientData.occupation || null,
      now,
      now,
    ],
  );

  return {
    ...patientData,
    id: patientId,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
};

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  const patients = await query('SELECT * FROM patients WHERE id = ?', [patientId]);

  if (patients.length === 0) {
    return null;
  }

  const p = patients[0];
  return mapPatientFromDb(p);
};

/**
 * Get all patients
 */
export const getAllPatients = async (
  limit?: number,
  offset?: number,
): Promise<Patient[]> => {
  let sql = 'SELECT * FROM patients ORDER BY last_name, first_name';
  const params: any[] = [];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }

  const patients = await query(sql, params);
  return patients.map(mapPatientFromDb);
};

/**
 * Search patients
 */
export const searchPatients = async (
  searchTerm: string,
  limit: number = 50,
): Promise<Patient[]> => {
  const term = `%${searchTerm}%`;
  const patients = await query(
    `SELECT * FROM patients 
     WHERE first_name LIKE ? 
        OR last_name LIKE ? 
        OR phone LIKE ? 
        OR email LIKE ? 
        OR amka LIKE ?
     ORDER BY last_name, first_name
     LIMIT ?`,
    [term, term, term, term, term, limit],
  );

  return patients.map(mapPatientFromDb);
};

/**
 * Update patient
 */
export const updatePatient = async (
  patientId: string,
  patientData: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Patient> => {
  const updates: string[] = [];
  const values: any[] = [];

  if (patientData.firstName !== undefined) {
    updates.push('first_name = ?');
    values.push(patientData.firstName);
  }
  if (patientData.lastName !== undefined) {
    updates.push('last_name = ?');
    values.push(patientData.lastName);
  }
  if (patientData.phone !== undefined) {
    updates.push('phone = ?');
    values.push(patientData.phone);
  }
  if (patientData.email !== undefined) {
    updates.push('email = ?');
    values.push(patientData.email);
  }
  if (patientData.address) {
    if (patientData.address.street !== undefined) {
      updates.push('address_street = ?');
      values.push(patientData.address.street);
    }
    if (patientData.address.city !== undefined) {
      updates.push('address_city = ?');
      values.push(patientData.address.city);
    }
    if (patientData.address.postalCode !== undefined) {
      updates.push('address_postal_code = ?');
      values.push(patientData.address.postalCode);
    }
  }
  if (patientData.emergencyContact) {
    if (patientData.emergencyContact.name !== undefined) {
      updates.push('emergency_contact_name = ?');
      values.push(patientData.emergencyContact.name);
    }
    if (patientData.emergencyContact.phone !== undefined) {
      updates.push('emergency_contact_phone = ?');
      values.push(patientData.emergencyContact.phone);
    }
  }

  if (updates.length === 0) {
    const patient = await getPatientById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient;
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(patientId);

  await executeQuery(
    `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  const updated = await getPatientById(patientId);
  if (!updated) {
    throw new Error('Patient not found after update');
  }
  return updated;
};

/**
 * Delete patient (soft delete - set inactive flag if needed)
 */
export const deletePatient = async (patientId: string): Promise<void> => {
  // For now, hard delete. In production, consider soft delete
  await executeQuery('DELETE FROM patients WHERE id = ?', [patientId]);
};

/**
 * Map database row to Patient object
 */
const mapPatientFromDb = (row: any): Patient => {
  const address: Address | undefined = row.address_street
    ? {
        street: row.address_street,
        city: row.address_city || '',
        postalCode: row.address_postal_code || '',
        country: row.address_country || 'Greece',
      }
    : undefined;

  const emergencyContact: EmergencyContact | undefined =
    row.emergency_contact_name
      ? {
          name: row.emergency_contact_name,
          relationship: row.emergency_contact_relationship || '',
          phone: row.emergency_contact_phone || '',
        }
      : undefined;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: new Date(row.date_of_birth),
    gender: row.gender || undefined,
    amka: row.amka || undefined,
    phone: row.phone,
    email: row.email || undefined,
    address,
    emergencyContact,
    occupation: row.occupation || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

