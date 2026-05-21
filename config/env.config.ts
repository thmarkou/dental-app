/**
 * Environment configuration — loads from expo.extra.env (app.config.js + .env.dentalapp).
 */

import {Platform} from 'react-native';
import Constants from 'expo-constants';
import {
  isWeakEncryptionKey,
  isWeakJwtSecret,
  LOCAL_DEV_ENCRYPTION_KEY,
  LOCAL_DEV_JWT_SECRET,
} from './env.security';

export interface EnvConfig {
  appName: string;
  appBundleId: string;
  appPackageName: string;
  databaseName: string;
  databasePath: string;
  apiBaseUrl: string;
  apiTimeout: number;
  smsGateway: {
    apiKey: string;
    apiUrl: string;
    senderId: string;
    enabled: boolean;
  };
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
  myData: {
    apiUrl: string;
    apiKey: string;
    practiceAFM: string;
    practiceName: string;
    practiceAddress: string;
    practiceTaxId: string;
    enabled: boolean;
  };
  cloudBackup: {
    enabled: boolean;
    service: 'aws' | 'gcp' | 'azure';
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    sessionTimeout: number;
  };
  storage: {
    storagePath: string;
    uploadPath: string;
    cachePath: string;
  };
  sync: {
    enabled: boolean;
    interval: number;
    onStartup: boolean;
  };
  nodeEnv: 'development' | 'staging' | 'production';
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

type EnvMap = Record<string, string | undefined>;

function getRuntimeEnvMap(): EnvMap {
  const extra = Constants.expoConfig?.extra as {env?: EnvMap} | undefined;
  return extra?.env ?? {};
}

const isReleaseBuild = (): boolean =>
  typeof __DEV__ !== 'undefined' && !__DEV__;

const loadEnvConfig = (): EnvConfig => {
  const env = getRuntimeEnvMap();

  const getEnv = (key: string, defaultValue: string = ''): string => {
    const value = env[key];
    if (value !== undefined && value !== '') {
      return value;
    }
    return defaultValue;
  };

  const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
    const value = getEnv(key);
    if (value === 'false' || value === '0') {
      return false;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    return defaultValue;
  };

  const getEnvNumber = (key: string, defaultValue: number = 0): number => {
    const value = getEnv(key);
    const n = value ? parseInt(value, 10) : NaN;
    return Number.isFinite(n) ? n : defaultValue;
  };

  const nodeEnv = getEnv('NODE_ENV', 'development') as EnvConfig['nodeEnv'];

  return {
    appName: getEnv('APP_NAME', 'Dental Practice Management'),
    appBundleId: getEnv('APP_BUNDLE_ID', 'com.dentalapp.practice'),
    appPackageName: getEnv('APP_PACKAGE_NAME', 'com.dentalapp.practice'),

    databaseName: getEnv('DATABASE_NAME', 'dentalapp'),
    databasePath: getEnv(
      'DATABASE_PATH',
      Platform.OS === 'ios'
        ? './data/dentalapp.db'
        : '/data/data/com.dentalapp.practice/databases/dentalapp.db',
    ),

    apiBaseUrl: getEnv('API_BASE_URL', 'http://localhost:3000'),
    apiTimeout: getEnvNumber('API_TIMEOUT', 30000),

    smsGateway: {
      apiKey: getEnv('SMS_GATEWAY_API_KEY'),
      apiUrl: getEnv('SMS_GATEWAY_API_URL'),
      senderId: getEnv('SMS_GATEWAY_SENDER_ID'),
      enabled: getEnvBool('FEATURE_SMS_REMINDERS', false),
    },

    emailService: {
      provider: getEnv('EMAIL_SERVICE_PROVIDER', 'smtp') as
        | 'smtp'
        | 'sendgrid'
        | 'mailgun',
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
      service: getEnv('CLOUD_BACKUP_SERVICE', 'aws') as 'aws' | 'gcp' | 'azure',
      accessKey: getEnv('CLOUD_BACKUP_ACCESS_KEY'),
      secretKey: getEnv('CLOUD_BACKUP_SECRET_KEY'),
      bucket: getEnv('CLOUD_BACKUP_BUCKET'),
    },

    security: {
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

    nodeEnv,
    debugMode: getEnvBool('DEBUG_MODE', nodeEnv !== 'production'),
    logLevel: getEnv('LOG_LEVEL', nodeEnv === 'production' ? 'warn' : 'debug') as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error',
  };
};

const validateEnvConfig = (config: EnvConfig): void => {
  const errors: string[] = [];
  const productionLike =
    config.nodeEnv === 'production' || isReleaseBuild();

  if (productionLike) {
    if (isWeakJwtSecret(config.security.jwtSecret)) {
      errors.push(
        'JWT_SECRET is required for production — set in .env.dentalapp or EAS secrets',
      );
    }
    if (isWeakEncryptionKey(config.security.encryptionKey)) {
      errors.push(
        'ENCRYPTION_KEY is required for production (min 32 chars) — set in .env.dentalapp or EAS secrets',
      );
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

let envConfig: EnvConfig;

try {
  envConfig = loadEnvConfig();
  validateEnvConfig(envConfig);
  if (
    isWeakJwtSecret(envConfig.security.jwtSecret) ||
    isWeakEncryptionKey(envConfig.security.encryptionKey)
  ) {
    console.warn(
      '[env] Using dev JWT_SECRET / ENCRYPTION_KEY. Copy env.dentalapp.example → .env.dentalapp and run: npm run env:secrets',
    );
  }
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  throw error;
}

export default envConfig;
export {validateEnvConfig, loadEnvConfig, isReleaseBuild};
