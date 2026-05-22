/**
 * Password hashing — PBKDF2-SHA256 via @noble/hashes (pure JS, no native modules).
 * v2: 6k iterations (~100–500ms on device). v1: 120k legacy verify only.
 */

import {pbkdf2} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

const SCHEMA_V1 = 'v1';
const SCHEMA_V2 = 'v2';
export const CURRENT_PASSWORD_SCHEMA = SCHEMA_V2;

export const PBKDF2_ITERATIONS_V1 = 120_000;
export const PBKDF2_ITERATIONS_V2 = 6_000;

const SALT_BYTES = 16;
const DK_LEN = 32;
const LEGACY_PREFIX = 'hashed_';

function passwordBytes(password: string): Uint8Array {
  return utf8ToBytes(password);
}

function iterationsForSchema(schema: string): number {
  if (schema === SCHEMA_V2) {
    return PBKDF2_ITERATIONS_V2;
  }
  if (schema === SCHEMA_V1) {
    return PBKDF2_ITERATIONS_V1;
  }
  return PBKDF2_ITERATIONS_V1;
}

function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Uint8Array {
  return pbkdf2(sha256, passwordBytes(password), salt, {
    c: iterations,
    dkLen: DK_LEN,
  });
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

function formatHash(
  schema: string,
  password: string,
  salt: Uint8Array,
): string {
  const dk = derivePbkdf2(password, salt, iterationsForSchema(schema));
  return `${schema}$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}

export function isLegacyPasswordHash(hash: string): boolean {
  return hash.startsWith(LEGACY_PREFIX);
}

export function hashPasswordSync(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  return formatHash(CURRENT_PASSWORD_SCHEMA, password, salt);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  return formatHash(CURRENT_PASSWORD_SCHEMA, password, salt);
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    return storedHash === `${LEGACY_PREFIX}${password}`;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }
  const schema = parts[0];
  if (schema !== SCHEMA_V1 && schema !== SCHEMA_V2) {
    return false;
  }
  try {
    const salt = hexToBytes(parts[1]);
    const expected = hexToBytes(parts[2]);
    const actual = derivePbkdf2(
      password,
      salt,
      iterationsForSchema(schema),
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function shouldUpgradePasswordHash(storedHash: string): boolean {
  return (
    isLegacyPasswordHash(storedHash) ||
    storedHash.startsWith(`${SCHEMA_V1}$`) ||
    !storedHash.startsWith(`${SCHEMA_V2}$`)
  );
}

/** @deprecated use PBKDF2_ITERATIONS_V1 */
export const PBKDF2_ITERATIONS = PBKDF2_ITERATIONS_V1;
