import {patientDisplayName} from '../components/appointments/appointmentGrid.utils';
import type {Patient} from '../types';

const patients: Record<string, Patient> = {
  p1: {
    id: 'p1',
    firstName: 'Μαρία',
    lastName: 'Παπαδοπούλου',
    dateOfBirth: new Date('1980-01-01'),
    gender: 'female',
    phone: '6912345678',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('appointmentGrid.utils', () => {
  it('patientDisplayName full vs short', () => {
    expect(patientDisplayName(patients, 'p1', 'full')).toBe(
      'Μαρία Παπαδοπούλου',
    );
    expect(patientDisplayName(patients, 'p1', 'short')).toBe('Μ. Παπαδοπούλου');
    expect(patientDisplayName(patients, 'missing', 'full')).toBe('?');
  });
});
