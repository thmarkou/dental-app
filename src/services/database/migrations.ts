/**
 * Database Migrations
 * Version-controlled schema changes
 */

import {open} from 'react-native-quick-sqlite';

export type Database = ReturnType<typeof open>;

export interface Migration {
  version: number;
  up: (db: Database) => void;
  down?: (db: Database) => void;
  /** Set true when migration uses PRAGMA foreign_keys (cannot run inside a transaction). */
  skipOuterTransaction?: boolean;
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
  {
    version: 3,
    up: (database) => {
      // Create default admin user
      // Password: admin123 (hashed with simple hash: hashed_admin123)
      const now = new Date().toISOString();
      
      // Check if admin user already exists
      const existingAdmin = database.execute(
        'SELECT id FROM users WHERE username = ?',
        ['admin']
      );
      
      if (existingAdmin.rows?._array?.length === 0) {
        database.execute(
          `INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '00000000-0000-0000-0000-000000000001', // Fixed UUID for admin
            'admin',
            'admin@dentalpractice.gr',
            'hashed_admin123', // Password: admin123
            'admin',
            'Admin',
            'User',
            1,
            now,
            now,
          ]
        );
        console.log('✅ Default admin user created');
      }
    },
  },
  {
    version: 4,
    up: (database) => {
      // Add patient photo column if it doesn't exist
      try {
        database.execute('ALTER TABLE patients ADD COLUMN photo_uri TEXT;');
      } catch (error) {
        // Ignore error if column already exists
        console.log('photo_uri column already exists or could not be added');
      }
    },
  },
  {
    version: 5,
    up: (database) => {
      const addPatientColumn = (sql: string) => {
        try {
          database.execute(sql);
        } catch {
          // Column may already exist if migration was partially applied
          console.log('Skipping patient column add (may already exist)');
        }
      };

      addPatientColumn('ALTER TABLE patients ADD COLUMN afm TEXT;');
      addPatientColumn('ALTER TABLE patients ADD COLUMN doy TEXT;');
      addPatientColumn(
        'ALTER TABLE patients ADD COLUMN gdpr_consent INTEGER DEFAULT 0;',
      );
      addPatientColumn('ALTER TABLE patients ADD COLUMN gdpr_date TEXT;');

      database.execute(`
        CREATE TABLE IF NOT EXISTS treatments (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          appointment_id TEXT,
          tooth_number INTEGER,
          surface TEXT,
          service_id TEXT,
          cost REAL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS dental_chart (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          tooth_number INTEGER NOT NULL,
          condition TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          UNIQUE(patient_id, tooth_number)
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          transaction_date TEXT NOT NULL,
          receipt_issued INTEGER DEFAULT 0,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
      `);

      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_treatments_appointment ON treatments(appointment_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_dental_chart_patient ON dental_chart(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON payments(transaction_date);',
      );
    },
  },
  {
    version: 6,
    up: (database) => {
      try {
        database.execute('ALTER TABLE payments ADD COLUMN notes TEXT;');
      } catch {
        console.log('payments.notes column may already exist');
      }
    },
  },
  {
    version: 7,
    skipOuterTransaction: true,
    up: (database) => {
      database.execute('PRAGMA foreign_keys = OFF;');
      try {
        database.execute(`
          CREATE TABLE appointments_new (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('initial_consultation', 'regular_checkup', 'cleaning', 'treatment', 'follow_up', 'emergency', 'consultation')),
            status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
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
        database.execute(`
          INSERT INTO appointments_new SELECT * FROM appointments;
        `);
        database.execute('DROP TABLE appointments;');
        database.execute('ALTER TABLE appointments_new RENAME TO appointments;');
        database.execute(
          'CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);',
        );
        database.execute(
          'CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);',
        );
        database.execute(
          'CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);',
        );
        database.execute(
          'CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);',
        );
      } finally {
        database.execute('PRAGMA foreign_keys = ON;');
      }
    },
  },
  {
    version: 8,
    up: (database) => {
      database.execute(`
        CREATE TABLE IF NOT EXISTS patient_documents (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          document_type TEXT NOT NULL CHECK(document_type IN ('xray', 'consent', 'other')),
          title TEXT,
          file_uri TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
      `);
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);',
      );
      try {
        database.execute('ALTER TABLE treatments ADD COLUMN procedure_type TEXT;');
      } catch {
        console.log('treatments.procedure_type may already exist');
      }
    },
  },
  {
    version: 9,
    up: (database) => {
      try {
        database.execute('ALTER TABLE payments ADD COLUMN mydata_mark TEXT;');
      } catch {
        console.log('payments.mydata_mark may already exist');
      }
    },
  },
  {
    version: 10,
    up: (database) => {
      database.execute(`
        UPDATE dental_chart SET condition = CASE TRIM(condition)
          WHEN 'HEALTHY' THEN 'Cleaning'
          WHEN 'CARIES' THEN 'Caries'
          WHEN 'FILLING' THEN 'Filling'
          WHEN 'ENDO' THEN 'Root Canal'
          WHEN 'CROWN' THEN 'Crown'
          WHEN 'BRIDGE' THEN 'Bridge'
          WHEN 'MISSING' THEN 'Missing'
          WHEN 'FILLED' THEN 'Filling'
          WHEN 'MISSING_TOOTH' THEN 'Missing'
          WHEN 'ROOT_CANAL_TREATED' THEN 'Root Canal'
          ELSE condition
        END
      `);
    },
  },
  {
    version: 11,
    up: (database) => {
      database.execute(
        `DELETE FROM dental_chart WHERE TRIM(condition) = 'Cleaning'`,
      );
    },
  },
];
