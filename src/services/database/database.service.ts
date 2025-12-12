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

// Track if database is available
export let isDatabaseAvailable = false;

/**
 * Initialize database connection
 * Note: expo-sqlite requires a development build, not Expo Go
 * This will fail gracefully if running in Expo Go
 */
export const initDatabase = async (): Promise<void> => {
  try {
    // Check if SQLite is available (requires development build)
    if (!SQLite || typeof SQLite.openDatabaseAsync !== 'function') {
      console.warn('SQLite not available - requires development build');
      return;
    }

    // Open database connection using expo-sqlite
    // expo-sqlite v16+ API: openDatabaseAsync(name, options?)
    // The database will be created in the default SQLite directory
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Run migrations
    await runMigrations();

    isDatabaseAvailable = true;
    console.log('Database initialized successfully');
  } catch (error: any) {
    // If error is about directory not being available, it means we're in Expo Go
    if (error?.message?.includes('directory') || error?.message?.includes('null')) {
      console.warn(
        'Database initialization skipped - expo-sqlite requires development build.\n' +
        'Run: npx expo run:ios or npx expo run:android\n' +
        'Or create development build: npx expo prebuild && npx expo run:ios'
      );
      isDatabaseAvailable = false;
      // Don't throw - allow app to continue without database for now
      return;
    }
    isDatabaseAvailable = false;
    console.error('Failed to initialize database:', error);
    // Don't throw - allow app to continue
  }
};

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    throw new Error(
      'Database not initialized. This app requires a development build.\n' +
      'Run: npx expo prebuild && npx expo run:ios'
    );
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

