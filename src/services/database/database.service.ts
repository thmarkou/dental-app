/**
 * Database Service
 * SQLite database management for offline-first architecture
 */

// Using expo-sqlite instead of react-native-quick-sqlite for Expo compatibility
// Note: expo-sqlite requires development build, not Expo Go
let SQLite: any = null;
try {
  SQLite = require('expo-sqlite');
} catch (error) {
  // Module not available - will be handled in initDatabase
  console.warn('expo-sqlite module not available at import time');
}

import {migrations} from './migrations';

// Database configuration
const DB_NAME = 'dentalapp';

// Initialize database connection
let db: SQLite.SQLiteDatabase | null = null;

// Track if database is available
export let isDatabaseAvailable = false;

/**
 * Initialize database connection
 * Note: expo-sqlite requires a development build, not Expo Go
 * This will fail gracefully if running in Expo Go
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // Check if SQLite module is available
    if (!SQLite) {
      console.warn('SQLite module not available');
      isDatabaseAvailable = false;
      return;
    }

    // Check if openDatabaseAsync function exists
    if (typeof SQLite.openDatabaseAsync !== 'function') {
      console.warn('SQLite.openDatabaseAsync not available');
      isDatabaseAvailable = false;
      return;
    }

    console.log('Attempting to open database...');
    
    // Open database connection using expo-sqlite
    // expo-sqlite v16+ API: openDatabaseAsync(name, options?)
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    console.log('Database opened successfully');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Run migrations
    await runMigrations();

    isDatabaseAvailable = true;
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    // Log the full error to understand what's happening
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || '';
    
    console.error('❌ Database initialization error:', errorMessage);
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });
    
    // Check for specific error types
    if (
      errorMessage.includes('Cannot find native module') ||
      errorMessage.includes('ExpoSQLite') ||
      errorMessage.includes('directory') ||
      errorMessage.includes('null') ||
      errorMessage.includes('not available')
    ) {
      console.warn(
        '⚠️ Database not available. This usually means:\n' +
        '1. Running in Expo Go (use development build instead)\n' +
        '2. Native module not properly linked\n' +
        '3. Need to rebuild: npx expo run:ios'
      );
      isDatabaseAvailable = false;
      return;
    }
    
    // For any other error, still mark as unavailable but log it
    isDatabaseAvailable = false;
    console.error('Unexpected database error:', error);
  }
};

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    if (!isDatabaseAvailable) {
      throw new Error(
        'Database not available. This app requires a development build.\n' +
        'Run: npx expo prebuild && npx expo run:ios\n' +
        'The app UI is available for preview without database.'
      );
    }
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
  if (!isDatabaseAvailable) {
    throw new Error(
      'Database not available. This app requires a development build.\n' +
      'Run: npx expo prebuild && npx expo run:ios'
    );
  }
  
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
  if (!isDatabaseAvailable) {
    throw new Error(
      'Database not available. This app requires a development build.\n' +
      'Run: npx expo prebuild && npx expo run:ios'
    );
  }
  
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
 * Note: expo-sqlite stores DB in app's documents directory
 * For backup, we'll use expo-file-system to copy the file
 */
export const backupDatabase = async (): Promise<string> => {
  try {
    const FileSystem = await import('expo-file-system');
    const {documentDirectory} = FileSystem;
    
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }
    
    const dbPath = `${documentDirectory}SQLite/${DB_NAME}.db`;
    const backupPath = `${documentDirectory}SQLite/${DB_NAME}.backup.${Date.now()}.db`;
    
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
    const FileSystem = await import('expo-file-system');
    const {documentDirectory} = FileSystem;
    
    if (!documentDirectory) {
      throw new Error('Document directory not available');
    }
    
    const dbPath = `${documentDirectory}SQLite/${DB_NAME}.db`;
    
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

