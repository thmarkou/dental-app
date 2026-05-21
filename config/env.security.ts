/**
 * Security env constants — shared by runtime config and Node validation scripts.
 */

/** Bundled fallbacks for local dev only (offline SQLite, no .env file). */
export const LOCAL_DEV_JWT_SECRET = 'local-dev-jwt-secret-not-for-production';
export const LOCAL_DEV_ENCRYPTION_KEY = 'local-dev-encryption-key-32-chars!!';

/** Minimum length for AES-256 style keys. */
export const MIN_ENCRYPTION_KEY_LENGTH = 32;

/** Values that must never ship in production builds. */
export const WEAK_JWT_PLACEHOLDERS = new Set([
  LOCAL_DEV_JWT_SECRET,
  'your_jwt_secret_key_change_this',
  'dev_jwt_secret_change_in_production',
]);

export const WEAK_ENCRYPTION_PLACEHOLDERS = new Set([
  LOCAL_DEV_ENCRYPTION_KEY,
  'your_encryption_key_change_this',
  'dev_encryption_key_change_in_production',
]);

export function isWeakJwtSecret(value: string | undefined): boolean {
  const v = (value ?? '').trim();
  return !v || WEAK_JWT_PLACEHOLDERS.has(v);
}

export function isWeakEncryptionKey(value: string | undefined): boolean {
  const v = (value ?? '').trim();
  return (
    !v ||
    v.length < MIN_ENCRYPTION_KEY_LENGTH ||
    WEAK_ENCRYPTION_PLACEHOLDERS.has(v)
  );
}
