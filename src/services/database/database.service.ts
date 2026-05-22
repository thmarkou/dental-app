/**
 * Database Service
 * SQLite database management using react-native-quick-sqlite
 * Simple, fast, and reliable SQLite for React Native
 */

import {open} from 'react-native-quick-sqlite';
import {DEFAULT_ADMIN_PASSWORD_HASH} from '../../constants/defaultAdminPassword';
import {migrations} from './migrations';
import * as FileSystem from 'expo-file-system';

// Database configuration
// react-native-quick-sqlite `location: 'default'` resolves to:
// - iOS: app sandbox Documents (persists; suitable for backups)
// - Android: internal app storage (not SD card; private to the app)
const DB_NAME = 'dentalapp';

// Initialize database connection
let db: ReturnType<typeof open> | null = null;

// Track if database is available
export let isDatabaseAvailable = false;

/**
 * Initialize database connection
 */
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('📦 Initializing database...');

    // Open database connection
    // react-native-quick-sqlite automatically creates the database if it doesn't exist
    db = open({
      name: DB_NAME,
      location: 'default', // Documents directory
    });

    console.log('✅ Database opened successfully');

    // Enable foreign keys
    db.execute('PRAGMA foreign_keys = ON;');

    // Run migrations
    await runMigrations();

    isDatabaseAvailable = true;
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error('❌ Database initialization error:', errorMessage);
    console.error('Error details:', error);
    isDatabaseAvailable = false;
  }
};

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    db.close();
    db = null;
  }
};

/**
 * Execute SQL query
 */
export const executeQuery = async (
  sql: string,
  params: any[] = [],
): Promise<{rows: any[]; insertId?: number; rowsAffected: number}> => {
  const database = getDatabase();

  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    const result = database.execute(sql, params);
    return {
      rows: result.rows?._array || [],
      rowsAffected: 0,
    };
  } else {
    const result = database.execute(sql, params);
    return {
      rows: [],
      insertId: result.insertId,
      rowsAffected: result.rowsAffected || 0,
    };
  }
};

/**
 * Execute SQL query and return rows
 */
export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  const result = await executeQuery(sql, params);
  return result.rows || [];
};

/**
 * Execute transaction
 */
export const transaction = async (callback: () => Promise<void>): Promise<void> => {
  const database = getDatabase();
  database.execute('BEGIN TRANSACTION;');
  try {
    await callback();
    database.execute('COMMIT;');
  } catch (error) {
    database.execute('ROLLBACK;');
    throw error;
  }
};

/**
 * Run database migrations
 */
const runMigrations = async (): Promise<void> => {
  const database = getDatabase();

  // Create migrations table if it doesn't exist
  database.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const versionResult = database.execute(
    'SELECT MAX(version) as version FROM schema_migrations',
  );
  const currentVersion = versionResult.rows?._array?.[0]?.version || 0;

  // Run migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}...`);
      const runStandalone = migration.skipOuterTransaction === true;
      if (!runStandalone) {
        database.execute('BEGIN TRANSACTION;');
      }
      try {
        migration.up(database);
        database.execute(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
          [migration.version, new Date().toISOString()],
        );
        if (!runStandalone) {
          database.execute('COMMIT;');
        }
        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        if (!runStandalone) {
          database.execute('ROLLBACK;');
        }
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  ensureBootstrapRows(database);
};

/** Idempotent rows required for login and settings (repair partial DBs). */
function ensureBootstrapRows(database: ReturnType<typeof open>): void {
  const now = new Date().toISOString();

  const adminRows = database.execute(
    "SELECT id FROM users WHERE username = 'admin'",
  ).rows?._array;
  if (!adminRows?.length) {
    database.execute(
      `INSERT INTO users (
        id, username, email, password_hash, role, first_name, last_name,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'admin@dentalpractice.gr',
        DEFAULT_ADMIN_PASSWORD_HASH,
        'admin',
        'Admin',
        'User',
        now,
        now,
      ],
    );
    console.log('✅ Bootstrap admin user ensured');
  }

  database.execute(
    `INSERT OR IGNORE INTO practice_settings (id, legal_name, updated_at)
     VALUES ('default', '', datetime('now'))`,
  );

  database.execute(
    `INSERT OR IGNORE INTO reminder_settings (
      id, scope, patient_id, enabled, hours_before, channels, updated_at
    ) VALUES ('practice_default', 'practice', NULL, 1, 24, '["local_push"]', ?)`,
    [now],
  );
}

/**
 * Backup database
 */
export const backupDatabase = async (): Promise<string> => {
  try {
    const {documentDirectory} = FileSystem;
    
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }
    
    // react-native-quick-sqlite stores DB in Documents directory
    const dbPath = `${documentDirectory}${DB_NAME}`;
    const backupPath = `${documentDirectory}${DB_NAME}.backup.${Date.now()}`;
    
    // Copy database file
    await FileSystem.copyAsync({
      from: dbPath,
      to: backupPath,
    });
    
    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
};

/**
 * Restore database from backup
 */
export const restoreDatabase = async (backupPath: string): Promise<void> => {
  try {
    const {documentDirectory} = FileSystem;
    
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }
    
    const dbPath = `${documentDirectory}${DB_NAME}`;
    
    // Close current connection
    await closeDatabase();
    
    // Copy backup to database location
    await FileSystem.copyAsync({
      from: backupPath,
      to: dbPath,
    });
    
    // Reinitialize database
    await initDatabase();
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};
