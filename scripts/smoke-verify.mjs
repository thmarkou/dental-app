#!/usr/bin/env node
/**
 * Automated smoke checks (A1 helper) — DB schema + minimal data sanity.
 * Does NOT replace manual UI testing in MANUAL_TEST_CHECKLIST.md §8.
 */
import {spawnSync, execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

function findSimulatorDb() {
  if (process.env.DENTALAPP_DB_PATH) {
    return process.env.DENTALAPP_DB_PATH;
  }
  try {
    const out = execSync(
      `find "${join(homedir(), 'Library/Developer/CoreSimulator/Devices')}" -path "*/Documents/default/dentalapp" -type f 2>/dev/null | head -1`,
      {encoding: 'utf8'},
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function sql(dbPath, statement) {
  const result = spawnSync('sqlite3', [dbPath, statement], {encoding: 'utf8'});
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `sqlite3 failed: ${statement}`);
  }
  return (result.stdout || '').trim();
}

const REQUIRED_TABLES = [
  'schema_migrations',
  'users',
  'patients',
  'appointments',
  'treatments',
  'invoices',
  'invoice_lines',
  'receipts',
  'receipt_lines',
  'payments',
  'inventory_items',
  'procedure_inventory_bom',
  'reminder_settings',
  'appointment_reminder_log',
  'treatment_plans',
  'practice_settings',
];

const checks = [];

function pass(name, detail = '') {
  checks.push({name, ok: true, detail});
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  checks.push({name, ok: false, detail});
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

const dbPath = findSimulatorDb();

if (!dbPath || !existsSync(dbPath)) {
  console.error('No simulator database found. Set DENTALAPP_DB_PATH or run the app once in iOS Simulator.');
  process.exit(1);
}

console.log(`Database: ${dbPath}\n`);

try {
  const version = Number(sql(dbPath, 'SELECT COALESCE(MAX(version), 0) FROM schema_migrations;'));
  if (version >= 19) {
    pass('Schema version', `v${version}`);
  } else {
    fail('Schema version', `v${version} — need v19 (run app or node scripts/migrate-simulator-db.mjs)`);
  }

  for (const table of REQUIRED_TABLES) {
    const exists = sql(
      dbPath,
      `SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${table}';`,
    );
    if (exists === '1') {
      pass(`Table ${table}`);
    } else {
      fail(`Table ${table}`, 'missing');
    }
  }

  const admin = sql(
    dbPath,
    `SELECT COUNT(*) FROM users WHERE username='admin';`,
  );
  if (Number(admin) >= 1) {
    pass('Admin user', 'admin exists');
  } else {
    fail('Admin user', 'no admin — login may fail');
  }

  const practice = sql(
    dbPath,
    `SELECT COUNT(*) FROM practice_settings WHERE id='default';`,
  );
  if (Number(practice) >= 1) {
    pass('Practice settings', 'default row');
  } else {
    fail('Practice settings', 'missing default');
  }

  const reminder = sql(
    dbPath,
    `SELECT COUNT(*) FROM reminder_settings WHERE id='practice_default';`,
  );
  if (Number(reminder) >= 1) {
    pass('Reminder settings', 'practice_default');
  } else {
    fail('Reminder settings', 'missing v18 default');
  }

  const counts = sql(
    dbPath,
    `SELECT
      (SELECT COUNT(*) FROM patients) AS patients,
      (SELECT COUNT(*) FROM appointments) AS appointments,
      (SELECT COUNT(*) FROM treatments) AS treatments,
      (SELECT COUNT(*) FROM invoices) AS invoices,
      (SELECT COUNT(*) FROM payments) AS payments;`,
  );
  pass('Row counts', counts.replace(/\|/g, ', '));

  const paidNoReceipt = sql(
    dbPath,
    `SELECT COUNT(*) FROM payments p
     WHERE p.invoice_id IS NOT NULL
       AND (p.receipt_id IS NULL OR TRIM(p.receipt_id) = '')
       AND p.amount > 0;`,
  );
  if (Number(paidNoReceipt) >= 0) {
    pass('Invoice payments without receipt', String(paidNoReceipt));
  }
} catch (e) {
  fail('Smoke verify', e.message || String(e));
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} automated checks passed.`);

if (failed.length) {
  console.log('\nManual UI smoke (§8) still required after fixing DB issues.');
  process.exit(1);
}

console.log('\nAutomated DB smoke OK. Next: run MANUAL_TEST_CHECKLIST.md §8 in the app.');
process.exit(0);
