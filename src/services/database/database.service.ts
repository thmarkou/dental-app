/**
 * Database Service
 * SQLite database management for offline-first architecture
 */

// Using expo-sqlite instead of react-native-quick-sqlite for Expo compatibility
import * as SQLite from 'expo-sqlite';
import {migrations} from './migrations';

// Database configuration
const DB_NAME = 'dentalapp';

// Initialize database connection
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database connection
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // Open database connection using expo-sqlite
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

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
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
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
    const result = await database.getAllAsync(sql, params);
    return {
      rows: result || [],
      rowsAffected: 0,
    };
  } else {
    const result = await database.runAsync(sql, params);
    return {
      rows: [],
      insertId: result.lastInsertRowId,
      rowsAffected: result.changes,
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
  await database.execAsync('BEGIN TRANSACTION;');
  try {
    await callback();
    await database.execAsync('COMMIT;');
  } catch (error) {
    await database.execAsync('ROLLBACK;');
    throw error;
  }
};

/**
 * Run database migrations
 */
const runMigrations = async (): Promise<void> => {
  const database = getDatabase();
  
  // Create migrations table if it doesn't exist
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const versionResult = await database.getAllAsync(
    'SELECT MAX(version) as version FROM schema_migrations',
  );
  const currentVersion = (versionResult[0] as any)?.version || 0;

  // Run migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration ${migration.version}...`);
      await database.execAsync('BEGIN TRANSACTION;');
      try {
        await migration.up(database);
        await database.runAsync(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
          [migration.version, new Date().toISOString()],
        );
        await database.execAsync('COMMIT;');
        console.log(`Migration ${migration.version} completed`);
      } catch (error) {
        await database.execAsync('ROLLBACK;');
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

