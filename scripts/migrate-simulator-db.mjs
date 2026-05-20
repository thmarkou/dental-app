#!/usr/bin/env node
/**
 * Applies pending SQLite migrations to the iOS Simulator dentalapp database.
 * Mirrors src/services/database/migrations.ts versions 13–18.
 */
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

const DEFAULT_DB = join(
  homedir(),
  'Library/Developer/CoreSimulator/Devices/FF09E555-A06B-49CB-B931-185171953A2B/data/Containers/Data/Application/9B16E89E-DBEC-4DE9-8B49-1EBFACEB6016/Documents/default/dentalapp',
);

const dbPath = process.env.DENTALAPP_DB_PATH || DEFAULT_DB;

function sql(statement, params = []) {
  const args = [dbPath];
  if (params.length) {
    for (const p of params) {
      args.push('-cmd', `.parameter init`);
      break;
    }
  }
  // Use parameterized queries via sqlite3 -cmd with escaped literals
  let cmd = statement.trim();
  if (params.length) {
    for (const p of params) {
      const escaped =
        p === null || p === undefined
          ? 'NULL'
          : `'${String(p).replace(/'/g, "''")}'`;
      cmd = cmd.replace('?', escaped);
    }
  }
  const result = spawnSync('sqlite3', [dbPath, cmd], {encoding: 'utf8'});
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `sqlite3 failed: ${cmd}`);
  }
  return (result.stdout || '').trim();
}

function maxVersion() {
  const v = sql('SELECT COALESCE(MAX(version), 0) FROM schema_migrations;');
  return Number(v) || 0;
}

function recordMigration(version) {
  const appliedAt = new Date().toISOString();
  sql(
    `INSERT INTO schema_migrations (version, applied_at) VALUES (${version}, '${appliedAt.replace(/'/g, "''")}');`,
  );
}

function migration13() {
  sql(`
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
  sql(`
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
  sql(`
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
  sql('CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);');
  sql('CREATE INDEX IF NOT EXISTS idx_treatment_plan_phases_plan ON treatment_plan_phases(plan_id);');
  sql('CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_phase ON treatment_plan_items(phase_id);');
}

function migration14() {
  sql(`
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
  sql(`INSERT OR IGNORE INTO practice_settings (id, legal_name, updated_at)
       VALUES ('default', '', datetime('now'));`);
}

function migration15() {
  sql(`
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
  sql(`
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
  sql('CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);');
  sql('CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id, created_at);');
}

function migration16() {
  sql(`
    CREATE TABLE IF NOT EXISTS treatment_plan_alternatives (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      total_estimated_cost REAL NOT NULL DEFAULT 0,
      is_selected INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE
    );
  `);
  try {
    sql('ALTER TABLE treatment_plan_phases ADD COLUMN alternative_id TEXT;');
  } catch {
    // column may exist
  }
  sql('CREATE INDEX IF NOT EXISTS idx_plan_alternatives_plan ON treatment_plan_alternatives(plan_id);');
  sql('CREATE INDEX IF NOT EXISTS idx_plan_phases_alternative ON treatment_plan_phases(alternative_id);');

  const plansRaw = sql('SELECT id FROM treatment_plans;');
  const planIds = plansRaw ? plansRaw.split('\n').filter(Boolean) : [];
  const now = new Date().toISOString();
  for (const planId of planIds) {
    const altId = randomUUID();
    sql(
      `INSERT INTO treatment_plan_alternatives (
        id, plan_id, name, description, sort_order, total_estimated_cost,
        is_selected, created_at
      ) VALUES (?, ?, ?, NULL, 0, 0, 1, ?)`,
      [altId, planId, 'Κύρια επιλογή', now],
    );
    sql('UPDATE treatment_plan_phases SET alternative_id = ? WHERE plan_id = ?', [
      altId,
      planId,
    ]);
  }
}

function migration17() {
  try {
    sql('ALTER TABLE treatment_plan_items ADD COLUMN treatment_ids TEXT;');
  } catch {
    /* exists */
  }
  try {
    sql('ALTER TABLE treatments ADD COLUMN plan_item_id TEXT;');
  } catch {
    /* exists */
  }
  sql('CREATE INDEX IF NOT EXISTS idx_treatments_plan_item ON treatments(plan_item_id);');
}

function migration18() {
  sql(`
    CREATE TABLE IF NOT EXISTS reminder_settings (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL DEFAULT 'practice',
      patient_id TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      hours_before INTEGER NOT NULL DEFAULT 24,
      channels TEXT NOT NULL DEFAULT '["local_push"]',
      updated_at TEXT NOT NULL
    );
  `);
  sql(`
    CREATE TABLE IF NOT EXISTS appointment_reminder_log (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      scheduled_for TEXT NOT NULL,
      sent_at TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      notification_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
    );
  `);
  sql('CREATE INDEX IF NOT EXISTS idx_reminder_log_appointment ON appointment_reminder_log(appointment_id);');
  sql('CREATE INDEX IF NOT EXISTS idx_reminder_log_due ON appointment_reminder_log(status, scheduled_for);');
  const now = new Date().toISOString();
  sql(
    `INSERT OR IGNORE INTO reminder_settings (
      id, scope, patient_id, enabled, hours_before, channels, updated_at
    ) VALUES ('practice_default', 'practice', NULL, 1, 24, '["local_push"]', ?)`,
    [now],
  );
}

const STEPS = [
  [13, migration13],
  [14, migration14],
  [15, migration15],
  [16, migration16],
  [17, migration17],
  [18, migration18],
];

if (!existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  console.error('Set DENTALAPP_DB_PATH or run the app once in the simulator.');
  process.exit(1);
}

const current = maxVersion();
console.log(`Database: ${dbPath}`);
console.log(`Current schema version: ${current}`);

for (const [version, run] of STEPS) {
  if (version <= current) {
    console.log(`⏭️  Migration ${version} already applied`);
    continue;
  }
  console.log(`Running migration ${version}...`);
  try {
    run();
    recordMigration(version);
    console.log(`✅ Migration ${version} completed`);
  } catch (err) {
    console.error(`❌ Migration ${version} failed:`, err.message || err);
    process.exit(1);
  }
}

const final = maxVersion();
console.log(`Done. Schema version is now ${final}.`);
if (final >= 18) {
  const tables = sql(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('reminder_settings','appointment_reminder_log');",
  );
  console.log(`Reminder tables: ${tables || '(none)'}`);
}
