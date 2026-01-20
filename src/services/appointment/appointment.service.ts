/**
 * Appointment Service
 * CRUD operations for appointments
 */

import {query, executeQuery} from '../database';
import {uuidv4} from '../../utils/uuid';
import {Appointment, AppointmentType, AppointmentStatus} from '../../types';

/**
 * Create a new appointment
 */
export const createAppointment = async (
  appointmentData: Omit<
    Appointment,
    'id' | 'createdAt' | 'updatedAt' | 'reminderSent' | 'reminderSentAt'
  >,
  createdBy: string,
): Promise<Appointment> => {
  const appointmentId = uuidv4();
  const now = new Date().toISOString();

  await executeQuery(
    `INSERT INTO appointments (
      id, patient_id, date, start_time, end_time, duration, type, status,
      doctor_id, chair_id, notes, check_in_time, check_out_time,
      created_at, created_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      appointmentId,
      appointmentData.patientId,
      appointmentData.date.toISOString().split('T')[0], // YYYY-MM-DD
      appointmentData.startTime.toISOString(),
      appointmentData.endTime.toISOString(),
      appointmentData.duration,
      appointmentData.type,
      appointmentData.status || 'scheduled',
      appointmentData.doctorId,
      appointmentData.chairId || null,
      appointmentData.notes || null,
      appointmentData.checkInTime?.toISOString() || null,
      appointmentData.checkOutTime?.toISOString() || null,
      now,
      createdBy,
      now,
    ],
  );

  return {
    ...appointmentData,
    id: appointmentId,
    reminderSent: false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (
  appointmentId: string,
): Promise<Appointment | null> => {
  const appointments = await query(
    'SELECT * FROM appointments WHERE id = ?',
    [appointmentId],
  );

  if (appointments.length === 0) {
    return null;
  }

  return mapAppointmentFromDb(appointments[0]);
};

/**
 * Get all appointments
 */
export const getAllAppointments = async (
  limit?: number,
  offset?: number,
): Promise<Appointment[]> => {
  let sql = 'SELECT * FROM appointments ORDER BY date, start_time';
  const params: any[] = [];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
    if (offset) {
      sql += ' OFFSET ?';
      params.push(offset);
    }
  }

  const appointments = await query(sql, params);
  return appointments.map(mapAppointmentFromDb);
};

/**
 * Get appointments by date range
 */
export const getAppointmentsByDateRange = async (
  startDate: Date,
  endDate: Date,
): Promise<Appointment[]> => {
  const appointments = await query(
    `SELECT * FROM appointments 
     WHERE date >= ? AND date <= ?
     ORDER BY date, start_time`,
    [
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    ],
  );

  return appointments.map(mapAppointmentFromDb);
};

/**
 * Get appointments for a specific date
 */
export const getAppointmentsByDate = async (date: Date): Promise<Appointment[]> => {
  const dateStr = date.toISOString().split('T')[0];
  const appointments = await query(
    'SELECT * FROM appointments WHERE date = ? ORDER BY start_time',
    [dateStr],
  );

  return appointments.map(mapAppointmentFromDb);
};

/**
 * Get appointments for a specific patient
 */
export const getAppointmentsByPatient = async (
  patientId: string,
): Promise<Appointment[]> => {
  const appointments = await query(
    'SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, start_time DESC',
    [patientId],
  );

  return appointments.map(mapAppointmentFromDb);
};

/**
 * Get appointments for a specific doctor
 */
export const getAppointmentsByDoctor = async (
  doctorId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<Appointment[]> => {
  let sql = 'SELECT * FROM appointments WHERE doctor_id = ?';
  const params: any[] = [doctorId];

  if (startDate && endDate) {
    sql += ' AND date >= ? AND date <= ?';
    params.push(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    );
  }

  sql += ' ORDER BY date, start_time';

  const appointments = await query(sql, params);
  return appointments.map(mapAppointmentFromDb);
};

/**
 * Update appointment
 */
export const updateAppointment = async (
  appointmentId: string,
  appointmentData: Partial<
    Omit<Appointment, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>
  >,
): Promise<Appointment> => {
  const updates: string[] = [];
  const values: any[] = [];

  if (appointmentData.patientId !== undefined) {
    updates.push('patient_id = ?');
    values.push(appointmentData.patientId);
  }
  if (appointmentData.date !== undefined) {
    updates.push('date = ?');
    values.push(appointmentData.date.toISOString().split('T')[0]);
  }
  if (appointmentData.startTime !== undefined) {
    updates.push('start_time = ?');
    values.push(appointmentData.startTime.toISOString());
  }
  if (appointmentData.endTime !== undefined) {
    updates.push('end_time = ?');
    values.push(appointmentData.endTime.toISOString());
  }
  if (appointmentData.duration !== undefined) {
    updates.push('duration = ?');
    values.push(appointmentData.duration);
  }
  if (appointmentData.type !== undefined) {
    updates.push('type = ?');
    values.push(appointmentData.type);
  }
  if (appointmentData.status !== undefined) {
    updates.push('status = ?');
    values.push(appointmentData.status);
  }
  if (appointmentData.doctorId !== undefined) {
    updates.push('doctor_id = ?');
    values.push(appointmentData.doctorId);
  }
  if (appointmentData.chairId !== undefined) {
    updates.push('chair_id = ?');
    values.push(appointmentData.chairId || null);
  }
  if (appointmentData.notes !== undefined) {
    updates.push('notes = ?');
    values.push(appointmentData.notes || null);
  }
  if (appointmentData.checkInTime !== undefined) {
    updates.push('check_in_time = ?');
    values.push(appointmentData.checkInTime?.toISOString() || null);
  }
  if (appointmentData.checkOutTime !== undefined) {
    updates.push('check_out_time = ?');
    values.push(appointmentData.checkOutTime?.toISOString() || null);
  }
  if (appointmentData.cancelledAt !== undefined) {
    updates.push('cancelled_at = ?');
    values.push(appointmentData.cancelledAt?.toISOString() || null);
  }
  if (appointmentData.cancellationReason !== undefined) {
    updates.push('cancellation_reason = ?');
    values.push(appointmentData.cancellationReason || null);
  }

  if (updates.length === 0) {
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    return appointment;
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(appointmentId);

  await executeQuery(
    `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  const updated = await getAppointmentById(appointmentId);
  if (!updated) {
    throw new Error('Appointment not found after update');
  }
  return updated;
};

/**
 * Delete appointment
 */
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  await executeQuery('DELETE FROM appointments WHERE id = ?', [appointmentId]);
};

/**
 * Check in patient
 */
export const checkInAppointment = async (
  appointmentId: string,
): Promise<Appointment> => {
  const checkInTime = new Date();
  return await updateAppointment(appointmentId, {
    checkInTime,
    status: 'confirmed',
  });
};

/**
 * Check out patient
 */
export const checkOutAppointment = async (
  appointmentId: string,
): Promise<Appointment> => {
  const checkOutTime = new Date();
  return await updateAppointment(appointmentId, {
    checkOutTime,
    status: 'completed',
  });
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (
  appointmentId: string,
  reason?: string,
): Promise<Appointment> => {
  return await updateAppointment(appointmentId, {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancellationReason: reason || null,
  });
};

/**
 * Map database row to Appointment object
 */
const mapAppointmentFromDb = (row: any): Appointment => {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: new Date(row.date + 'T00:00:00'),
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    duration: row.duration,
    type: row.type as AppointmentType,
    status: row.status as AppointmentStatus,
    doctorId: row.doctor_id,
    chairId: row.chair_id || undefined,
    notes: row.notes || undefined,
    reminderSent: row.reminder_sent === 1,
    reminderSentAt: row.reminder_sent_at ? new Date(row.reminder_sent_at) : undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    cancellationReason: row.cancellation_reason || undefined,
    checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
    checkOutTime: row.check_out_time ? new Date(row.check_out_time) : undefined,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    updatedAt: new Date(row.updated_at),
  };
};

