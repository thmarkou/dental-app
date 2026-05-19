/**
 * Environment Configuration
 * Loads and validates environment variables for the Dental Practice Management App
 * 
 * This file ensures all required environment variables are loaded and provides
 * type-safe access to configuration values.
 */

import { Platform } from 'react-native';

// Load environment variables
// In React Native, we'll use react-native-config or similar
// For now, this is a placeholder structure

interface EnvConfig {
  // App Configuration
  appName: string;
  appBundleId: string;
  appPackageName: string;
  
  // Database Configuration
  databaseName: string;
  databasePath: string;
  
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;
  
  // SMS Gateway Configuration
  smsGateway: {
    apiKey: string;
    apiUrl: string;
    senderId: string;
    enabled: boolean;
  };
  
  // Email Service Configuration
  emailService: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
    enabled: boolean;
  };
  
  // myDATA API Configuration (Greek Tax Authority)
  myData: {
    apiUrl: string;
    apiKey: string;
    practiceAFM: string;
    practiceName: string;
    practiceAddress: string;
    practiceTaxId: string;
    enabled: boolean;
  };
  
  // Cloud Backup Configuration
  cloudBackup: {
    enabled: boolean;
    service: 'aws' | 'gcp' | 'azure';
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  
  // Security Configuration
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionTimeout: number;
  };
  
  // Storage Configuration
  storage: {
    storagePath: string;
    uploadPath: string;
    cachePath: string;
  };
  
  // Sync Configuration
  sync: {
    enabled: boolean;
    interval: number;
    onStartup: boolean;
  };
  
  // Development/Production
  nodeEnv: 'development' | 'staging' | 'production';
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Load environment variables
 * In React Native, use react-native-config or react-native-dotenv
 */
/** Bundled fallbacks when .env is not wired yet (offline app, local SQLite). */
const LOCAL_DEV_JWT_SECRET = 'local-dev-jwt-secret-not-for-production';
const LOCAL_DEV_ENCRYPTION_KEY = 'local-dev-encryption-key-32-chars!!';

const loadEnvConfig = (): EnvConfig => {
  // TODO: Replace with actual environment variable loading
  // For React Native, use: import Config from 'react-native-config';
  
  const getEnv = (_key: string, defaultValue: string = ''): string => {
    // This will be replaced with actual env loading
    // For now, return default or throw if required
    return defaultValue;
  };
  
  const getEnvBool = (_key: string, _defaultValue: boolean = false): boolean => {
    const value = getEnv(_key);
    return value === 'true' || value === '1';
  };
  
  const getEnvNumber = (_key: string, _defaultValue: number = 0): number => {
    const value = getEnv(_key);
    return value ? parseInt(value, 10) : _defaultValue;
  };
  
  return {
    appName: getEnv('APP_NAME', 'Dental Practice Management'),
    appBundleId: getEnv('APP_BUNDLE_ID', 'com.dentalapp.practice'),
    appPackageName: getEnv('APP_PACKAGE_NAME', 'com.dentalapp.practice'),
    
    databaseName: getEnv('DATABASE_NAME', 'dentalapp'),
    databasePath: getEnv('DATABASE_PATH', Platform.OS === 'ios' 
      ? './data/dentalapp.db' 
      : '/data/data/com.dentalapp.practice/databases/dentalapp.db'),
    
    apiBaseUrl: getEnv('API_BASE_URL', 'http://localhost:3000'),
    apiTimeout: getEnvNumber('API_TIMEOUT', 30000),
    
    smsGateway: {
      apiKey: getEnv('SMS_GATEWAY_API_KEY'),
      apiUrl: getEnv('SMS_GATEWAY_API_URL'),
      senderId: getEnv('SMS_GATEWAY_SENDER_ID'),
      enabled: getEnvBool('FEATURE_SMS_REMINDERS', false),
    },
    
    emailService: {
      provider: (getEnv('EMAIL_SERVICE_PROVIDER', 'smtp') as 'smtp' | 'sendgrid' | 'mailgun'),
      smtpHost: getEnv('EMAIL_SMTP_HOST'),
      smtpPort: getEnvNumber('EMAIL_SMTP_PORT', 587),
      smtpUser: getEnv('EMAIL_SMTP_USER'),
      smtpPassword: getEnv('EMAIL_SMTP_PASSWORD'),
      fromAddress: getEnv('EMAIL_FROM_ADDRESS'),
      fromName: getEnv('EMAIL_FROM_NAME', 'Dental Practice'),
      enabled: getEnvBool('FEATURE_EMAIL_NOTIFICATIONS', false),
    },
    
    myData: {
      apiUrl: getEnv('MYDATA_API_URL'),
      apiKey: getEnv('MYDATA_API_KEY'),
      practiceAFM: getEnv('MYDATA_PRACTICE_AFM'),
      practiceName: getEnv('MYDATA_PRACTICE_NAME'),
      practiceAddress: getEnv('MYDATA_PRACTICE_ADDRESS'),
      practiceTaxId: getEnv('MYDATA_PRACTICE_TAX_ID'),
      enabled: getEnvBool('FEATURE_MYDATA_INTEGRATION', false),
    },
    
    cloudBackup: {
      enabled: getEnvBool('CLOUD_BACKUP_ENABLED', false),
      service: (getEnv('CLOUD_BACKUP_SERVICE', 'aws') as 'aws' | 'gcp' | 'azure'),
      accessKey: getEnv('CLOUD_BACKUP_ACCESS_KEY'),
      secretKey: getEnv('CLOUD_BACKUP_SECRET_KEY'),
      bucket: getEnv('CLOUD_BACKUP_BUCKET'),
    },
    
    security: {
      // Always fall back until react-native-config / .env is connected.
      jwtSecret: getEnv('JWT_SECRET') || LOCAL_DEV_JWT_SECRET,
      encryptionKey: getEnv('ENCRYPTION_KEY') || LOCAL_DEV_ENCRYPTION_KEY,
      sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 3600000),
    },
    
    storage: {
      storagePath: getEnv('STORAGE_PATH', './storage/dentalapp'),
      uploadPath: getEnv('UPLOAD_PATH', './uploads/dentalapp'),
      cachePath: getEnv('CACHE_PATH', './cache/dentalapp'),
    },
    
    sync: {
      enabled: getEnvBool('SYNC_ENABLED', false),
      interval: getEnvNumber('SYNC_INTERVAL', 300000),
      onStartup: getEnvBool('SYNC_ON_STARTUP', false),
    },
    
    nodeEnv: (getEnv('NODE_ENV', 'development') as 'development' | 'staging' | 'production'),
    debugMode: getEnvBool('DEBUG_MODE', true),
    logLevel: (getEnv('LOG_LEVEL', 'debug') as 'debug' | 'info' | 'warn' | 'error'),
  };
};

/**
 * Validate required environment variables
 */
const validateEnvConfig = (config: EnvConfig): void => {
  const errors: string[] = [];

  if (config.nodeEnv === 'production') {
    if (
      !config.security.jwtSecret ||
      config.security.jwtSecret === LOCAL_DEV_JWT_SECRET
    ) {
      errors.push('JWT_SECRET is required for production builds');
    }
    if (
      !config.security.encryptionKey ||
      config.security.encryptionKey === LOCAL_DEV_ENCRYPTION_KEY
    ) {
      errors.push('ENCRYPTION_KEY is required for production builds');
    }
  }
  
  if (config.smsGateway.enabled && !config.smsGateway.apiKey) {
    errors.push('SMS_GATEWAY_API_KEY is required when SMS reminders are enabled');
  }
  
  if (config.emailService.enabled && !config.emailService.smtpHost) {
    errors.push('EMAIL_SMTP_HOST is required when email notifications are enabled');
  }
  
  if (config.myData.enabled && !config.myData.apiKey) {
    errors.push('MYDATA_API_KEY is required when myDATA integration is enabled');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
  }
};

// Load and validate configuration
let envConfig: EnvConfig;

try {
  envConfig = loadEnvConfig();
  validateEnvConfig(envConfig);
  if (
    envConfig.security.jwtSecret === LOCAL_DEV_JWT_SECRET ||
    envConfig.security.encryptionKey === LOCAL_DEV_ENCRYPTION_KEY
  ) {
    console.warn(
      '[env] Using bundled JWT_SECRET / ENCRYPTION_KEY defaults. Set real values in .env.dentalapp before production release.',
    );
  }
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  throw error;
}

export default envConfig;
export type { EnvConfig };

