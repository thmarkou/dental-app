/**
 * Database Migrations
 * Version-controlled schema changes
 */

import {SQLiteDatabase} from 'react-native-quick-sqlite';

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => void;
  down?: (db: SQLiteDatabase) => void;
}

/**
 * Database migrations
 * Add new migrations here as schema evolves
 */
export const migrations: Migration[] = [
  {
    version: 1,
    up: (database) => {
      // Users table
      database.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'dentist', 'assistant', 'receptionist')),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          is_active INTEGER DEFAULT 1,
          last_login TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Patients table
      database.execute(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          date_of_birth TEXT NOT NULL,
          gender TEXT CHECK(gender IN ('male', 'female', 'other')),
          amka TEXT,
          phone TEXT NOT NULL,
          email TEXT,
          address_street TEXT,
          address_city TEXT,
          address_postal_code TEXT,
          address_country TEXT DEFAULT 'Greece',
          emergency_contact_name TEXT,
          emergency_contact_relationship TEXT,
          emergency_contact_phone TEXT,
          occupation TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create indexes for patients
      database.execute('CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_patients_amka ON patients(amka);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);');
    },
  },
  {
    version: 2,
    up: (database) => {
      // Appointments table
      database.execute(`
        CREATE TABLE IF NOT EXISTS appointments (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          duration INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('initial_consultation', 'regular_checkup', 'cleaning', 'treatment', 'follow_up', 'emergency', 'consultation')),
          status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
          doctor_id TEXT NOT NULL,
          chair_id TEXT,
          notes TEXT,
          reminder_sent INTEGER DEFAULT 0,
          reminder_sent_at TEXT,
          cancelled_at TEXT,
          cancellation_reason TEXT,
          check_in_time TEXT,
          check_out_time TEXT,
          created_at TEXT NOT NULL,
          created_by TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (doctor_id) REFERENCES users(id)
        );
      `);

      // Create indexes for appointments
      database.execute('CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);');
      database.execute('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);');
    },
  },
  // Add more migrations as needed
];

