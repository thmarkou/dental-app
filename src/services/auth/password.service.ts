/**
 * Password hashing for React Native (PBKDF2-SHA256, no Node crypto).
 * Legacy `hashed_*` placeholders still verify until upgraded on login.
 */

import {pbkdf2} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

const SCHEMA = 'v1';
const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const DK_LEN = 32;
const LEGACY_PREFIX = 'hashed_';

function passwordBytes(password: string): Uint8Array {
  return utf8ToBytes(password);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export function isLegacyPasswordHash(hash: string): boolean {
  return hash.startsWith(LEGACY_PREFIX);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const dk = pbkdf2(sha256, passwordBytes(password), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: DK_LEN,
  });
  return `${SCHEMA}$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    return storedHash === `${LEGACY_PREFIX}${password}`;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== SCHEMA) {
    return false;
  }
  try {
    const salt = hexToBytes(parts[1]);
    const expected = hexToBytes(parts[2]);
    const actual = pbkdf2(sha256, passwordBytes(password), salt, {
      c: PBKDF2_ITERATIONS,
      dkLen: DK_LEN,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Re-hash after login when DB still has legacy or non-v1 hashes. */
export function shouldUpgradePasswordHash(storedHash: string): boolean {
  return isLegacyPasswordHash(storedHash) || !storedHash.startsWith(`${SCHEMA}$`);
}
