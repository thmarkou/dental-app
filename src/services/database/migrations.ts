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
  {
    version: 12,
    up: (database) => {
      database.execute(`
        CREATE TABLE IF NOT EXISTS fiscal_sequences (
          key TEXT PRIMARY KEY,
          last_value INTEGER NOT NULL DEFAULT 0
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          invoice_number TEXT UNIQUE NOT NULL,
          patient_id TEXT NOT NULL,
          issue_date TEXT NOT NULL,
          due_date TEXT,
          subtotal REAL NOT NULL,
          vat_rate REAL NOT NULL DEFAULT 24,
          vat_amount REAL NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'issued', 'paid', 'cancelled')),
          notes TEXT,
          created_by TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS invoice_lines (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL,
          line_total REAL NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS receipts (
          id TEXT PRIMARY KEY,
          receipt_number TEXT UNIQUE NOT NULL,
          patient_id TEXT NOT NULL,
          invoice_id TEXT,
          payment_id TEXT,
          issue_date TEXT NOT NULL,
          subtotal REAL NOT NULL,
          vat_rate REAL NOT NULL DEFAULT 24,
          vat_amount REAL NOT NULL,
          total_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          mydata_mark TEXT,
          mydata_submitted_at TEXT,
          notes TEXT,
          created_by TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
          FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS receipt_lines (
          id TEXT PRIMARY KEY,
          receipt_id TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL,
          vat_rate REAL NOT NULL DEFAULT 24,
          vat_amount REAL NOT NULL,
          line_total REAL NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
        );
      `);

      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_receipts_patient ON receipts(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_receipts_payment ON receipts(payment_id);',
      );

      const addPaymentColumn = (sql: string) => {
        try {
          database.execute(sql);
        } catch {
          console.log('payments column may already exist');
        }
      };
      addPaymentColumn('ALTER TABLE payments ADD COLUMN receipt_id TEXT;');
      addPaymentColumn('ALTER TABLE payments ADD COLUMN invoice_id TEXT;');
    },
  },
  {
    version: 13,
    up: (database) => {
      database.execute(`
        CREATE TABLE IF NOT EXISTS treatment_plans (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
            'draft', 'presented', 'approved', 'in_progress', 'completed', 'cancelled'
          )),
          total_estimated_cost REAL NOT NULL DEFAULT 0,
          created_by TEXT,
          approved_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS treatment_plan_phases (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          phase_number INTEGER NOT NULL,
          name TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN (
            'urgent', 'high', 'medium', 'low'
          )),
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
            'pending', 'in_progress', 'completed'
          )),
          sort_order INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE
        );
      `);

      database.execute(`
        CREATE TABLE IF NOT EXISTS treatment_plan_items (
          id TEXT PRIMARY KEY,
          phase_id TEXT NOT NULL,
          procedure_type TEXT NOT NULL,
          tooth_numbers TEXT,
          description TEXT,
          estimated_cost REAL,
          estimated_duration INTEGER DEFAULT 30,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN (
            'pending', 'scheduled', 'completed', 'cancelled'
          )),
          treatment_id TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (phase_id) REFERENCES treatment_plan_phases(id) ON DELETE CASCADE,
          FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL
        );
      `);

      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_treatment_plan_phases_plan ON treatment_plan_phases(plan_id);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_phase ON treatment_plan_items(phase_id);',
      );
    },
  },
  {
    version: 14,
    up: (database) => {
      database.execute(`
        CREATE TABLE IF NOT EXISTS practice_settings (
          id TEXT PRIMARY KEY CHECK (id = 'default'),
          legal_name TEXT NOT NULL DEFAULT '',
          trade_name TEXT,
          afm TEXT,
          doy TEXT,
          activity_code TEXT,
          address_street TEXT,
          address_city TEXT,
          address_postal_code TEXT,
          address_country TEXT NOT NULL DEFAULT 'Ελλάδα',
          phone TEXT,
          email TEXT,
          website TEXT,
          default_vat_rate REAL NOT NULL DEFAULT 24,
          invoice_footer TEXT,
          updated_at TEXT NOT NULL
        );
      `);
      database.execute(
        `INSERT OR IGNORE INTO practice_settings (id, legal_name, updated_at)
         VALUES ('default', '', datetime('now'));`,
      );
    },
  },
  {
    version: 15,
    up: (database) => {
      database.execute(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          sku TEXT,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          unit TEXT NOT NULL DEFAULT 'τεμ',
          quantity REAL NOT NULL DEFAULT 0,
          min_quantity REAL NOT NULL DEFAULT 0,
          unit_cost REAL,
          supplier TEXT,
          location TEXT,
          notes TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      database.execute(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id TEXT PRIMARY KEY,
          item_id TEXT NOT NULL,
          movement_type TEXT NOT NULL CHECK (
            movement_type IN ('purchase', 'usage', 'adjustment')
          ),
          quantity_delta REAL NOT NULL,
          quantity_after REAL NOT NULL,
          notes TEXT,
          performed_by TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
        );
      `);
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);',
      );
      database.execute(
        'CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id, created_at);',
      );
    },
  },
];
