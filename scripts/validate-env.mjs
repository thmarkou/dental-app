#!/usr/bin/env node
/**
 * Validate .env.dentalapp — required for A3 / production builds.
 * Usage:
 *   npm run env:check
 *   npm run env:check:prod
 */
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadMergedEnv} from './load-env-file.mjs';

const WEAK_JWT = new Set([
  'local-dev-jwt-secret-not-for-production',
  'your_jwt_secret_key_change_this',
  'dev_jwt_secret_change_in_production',
]);

const WEAK_ENC = new Set([
  'local-dev-encryption-key-32-chars!!',
  'your_encryption_key_change_this',
  'dev_encryption_key_change_in_production',
]);

const MIN_ENC_LEN = 32;
const envFile = process.env.ENV_FILE || '.env.dentalapp';
const strict =
  process.argv.includes('--strict') ||
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

if (!existsSync(resolve(process.cwd(), envFile))) {
  fail(
    `${envFile} not found. Run: cp env.dentalapp.example .env.dentalapp && npm run env:secrets`,
  );
}

const env = loadMergedEnv(envFile);
const nodeEnv = (env.NODE_ENV || process.env.NODE_ENV || 'development').trim();
const jwt = (env.JWT_SECRET || '').trim();
const enc = (env.ENCRYPTION_KEY || '').trim();

const required = ['APP_NAME', 'APP_BUNDLE_ID', 'APP_PACKAGE_NAME', 'DATABASE_NAME'];
const missing = required.filter(k => !(env[k] || '').trim());
if (missing.length) {
  fail(`Missing required keys: ${missing.join(', ')}`);
}
ok(`Required app keys present (${envFile})`);

if (WEAK_JWT.has(jwt) || !jwt) {
  (strict ? fail : warn)(
    strict
      ? 'JWT_SECRET is missing or uses a placeholder — run: npm run env:secrets'
      : 'JWT_SECRET uses dev/placeholder (OK for local dev; set real secret before release)',
  );
} else if (jwt.length < 32) {
  (strict ? fail : warn)('JWT_SECRET should be at least 32 characters for production');
} else {
  ok('JWT_SECRET looks configured');
}

if (WEAK_ENC.has(enc) || !enc) {
  (strict ? fail : warn)(
    strict
      ? `ENCRYPTION_KEY is missing or placeholder — run: npm run env:secrets (min ${MIN_ENC_LEN} chars)`
      : 'ENCRYPTION_KEY uses dev/placeholder (OK for local dev)',
  );
} else if (enc.length < MIN_ENC_LEN) {
  fail(`ENCRYPTION_KEY must be at least ${MIN_ENC_LEN} characters`);
} else {
  ok('ENCRYPTION_KEY looks configured');
}

if (strict && nodeEnv !== 'production') {
  warn(`NODE_ENV is "${nodeEnv}" — set NODE_ENV=production in ${envFile} for release builds`);
}

if (env.FEATURE_SMS_REMINDERS === 'true' && !(env.SMS_GATEWAY_API_KEY || '').trim()) {
  warn('FEATURE_SMS_REMINDERS=true but SMS_GATEWAY_API_KEY is empty');
}

console.log('');
console.log(
  strict
    ? 'Production env validation passed.'
    : 'Dev env check passed (use npm run env:check:prod before EAS production build).',
);
