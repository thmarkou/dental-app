/**
 * Precomputed v2 hash for default demo admin (password: admin123).
 * Fixed zero salt + 6000 PBKDF2-SHA256 iterations — avoids ~10s JS hash during migrations.
 */
export const DEFAULT_ADMIN_PASSWORD_HASH =
  'v2$00000000000000000000000000000000$d81f8e97074fa4794f073a9a87e1431c986746840f8cd085e1f42085fb1fe822';
