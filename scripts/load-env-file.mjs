#!/usr/bin/env node
/**
 * Parse .env.dentalapp (KEY=VALUE, # comments). Used by validate-env and tooling.
 */
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/**
 * @param {string} [filename]
 * @returns {Record<string, string>}
 */
export function loadEnvFile(filename = '.env.dentalapp') {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) {
    return {};
  }
  /** @type {Record<string, string>} */
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq < 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * File env with process.env overrides (EAS / CI inject secrets at build time).
 * @param {string} [filename]
 * @returns {Record<string, string>}
 */
export function loadMergedEnv(filename = '.env.dentalapp') {
  const file = loadEnvFile(filename);
  const merged = {...file};
  for (const key of Object.keys(file)) {
    if (process.env[key] !== undefined && process.env[key] !== '') {
      merged[key] = process.env[key];
    }
  }
  for (const key of ['JWT_SECRET', 'ENCRYPTION_KEY', 'NODE_ENV']) {
    if (process.env[key] !== undefined && process.env[key] !== '') {
      merged[key] = process.env[key];
    }
  }
  return merged;
}
