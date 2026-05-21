#!/usr/bin/env node
/**
 * Generate JWT_SECRET and ENCRYPTION_KEY (openssl or node crypto).
 * Usage:
 *   npm run env:secrets
 *   npm run env:secrets -- --write   # patch .env.dentalapp
 */
import {randomBytes} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const write = process.argv.includes('--write');
const envPath = resolve(process.cwd(), process.env.ENV_FILE || '.env.dentalapp');

const jwtSecret = randomBytes(32).toString('hex');
const encryptionKey = randomBytes(32).toString('hex');

console.log('Generated secrets (do not commit to Git):\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('');

if (!write) {
  console.log('Add the lines above to .env.dentalapp, or run: npm run env:secrets -- --write');
  process.exit(0);
}

if (!existsSync(envPath)) {
  console.error(`❌ ${envPath} not found. Run: cp env.dentalapp.example .env.dentalapp`);
  process.exit(1);
}

let text = readFileSync(envPath, 'utf8');
const setLine = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (re.test(text)) {
    text = text.replace(re, line);
  } else {
    text += `\n${line}\n`;
  }
};

setLine('JWT_SECRET', jwtSecret);
setLine('ENCRYPTION_KEY', encryptionKey);
writeFileSync(envPath, text, 'utf8');
console.log(`✅ Updated ${envPath}`);
