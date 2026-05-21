/**
 * Password hashing for offline React Native (bcryptjs + legacy placeholder support).
 */

import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;
const LEGACY_PREFIX = 'hashed_';

export function isLegacyPasswordHash(hash: string): boolean {
  return hash.startsWith(LEGACY_PREFIX);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    return storedHash === `${LEGACY_PREFIX}${password}`;
  }
  try {
    return bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

/** Re-hash after login when DB still has legacy `hashed_*` placeholder. */
export function shouldUpgradePasswordHash(storedHash: string): boolean {
  return isLegacyPasswordHash(storedHash);
}
