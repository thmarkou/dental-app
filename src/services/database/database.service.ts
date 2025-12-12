/**
 * Database Service
 * SQLite database management for offline-first architecture
 */

import {open, SQLiteDatabase} from 'react-native-quick-sqlite';
import {migrations} from './migrations';

// Database configuration
const DB_NAME = 'dentalapp';

// Initialize database connection
let db: SQLiteDatabase | null = null;

/**
 * Initialize database connection
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // Open database connection
    // react-native-quick-sqlite uses name and location
    db = open({
      name: DB_NAME,
      location: 'default', // 'default' stores in app's documents directory
    });

    // Enable foreign keys
    db.execute('PRAGMA foreign_keys = ON;');

    // Run migrations
    await runMigrations();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
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
export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
  }
};

/**
 * Execute SQL query
 */
export const executeQuery = (
  sql: string,
  params: any[] = [],
): {rows: any[]; insertId?: number; rowsAffected: number} => {
  const database = getDatabase();
  const result = database.execute(sql, params);
  return {
    rows: result.rows?._array || [],
    insertId: result.insertId,
    rowsAffected: result.rowsAffected || 0,
  };
};

/**
 * Execute SQL query and return rows
 */
export const query = (sql: string, params: any[] = []): any[] => {
  const result = executeQuery(sql, params);
  return result.rows || [];
};

/**
 * Execute transaction
 */
export const transaction = (callback: () => void): void => {
  const database = getDatabase();
  database.execute('BEGIN TRANSACTION;');
  try {
    callback();
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
  const currentVersion = versionResult.rows?.[0]?.version || 0;

  // Run migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}...`);
      database.execute('BEGIN TRANSACTION;');
      try {
        migration.up(database);
        database.execute(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
          [migration.version, new Date().toISOString()],
        );
        database.execute('COMMIT;');
        console.log(`Migration ${migration.version} completed`);
      } catch (error) {
        database.execute('ROLLBACK;');
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
};


/**
 * Backup database
 * Note: react-native-quick-sqlite stores DB in app's documents directory
 * For backup, we'll need to use react-native-fs to copy the file
 */
export const backupDatabase = async (): Promise<string> => {
  // Import dynamically to avoid issues if not installed
  const RNFS = require('react-native-fs');
  const {Platform} = require('react-native');
  
  const documentsPath = Platform.OS === 'ios' 
    ? RNFS.DocumentDirectoryPath 
    : RNFS.DocumentDirectoryPath;
  
  const dbPath = `${documentsPath}/${DB_NAME}.db`;
  const backupPath = `${documentsPath}/${DB_NAME}.backup.${Date.now()}.db`;
  
  // Copy database file
  await RNFS.copyFile(dbPath, backupPath);
  
  return backupPath;
};

/**
 * Restore database from backup
 */
export const restoreDatabase = async (backupPath: string): Promise<void> => {
  const RNFS = require('react-native-fs');
  const {Platform} = require('react-native');
  
  const documentsPath = Platform.OS === 'ios' 
    ? RNFS.DocumentDirectoryPath 
    : RNFS.DocumentDirectoryPath;
  
  const dbPath = `${documentsPath}/${DB_NAME}.db`;
  
  // Close current connection
  closeDatabase();
  
  // Copy backup to database location
  await RNFS.copyFile(backupPath, dbPath);
  
  // Reinitialize database
  await initDatabase();
};

