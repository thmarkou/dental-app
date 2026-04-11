/**
 * Patient Service Exports
 */

export {
  createPatient,
  getPatientById,
  getAllPatients,
  searchPatients,
  updatePatient,
  deletePatient,
} from './patient.service';

export type {Patient} from '../../types/patient';

