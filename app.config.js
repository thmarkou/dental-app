/**
 * Expo config — injects .env.dentalapp into expo.extra.env (read via expo-constants).
 * EAS / CI can override with process.env.JWT_SECRET, ENCRYPTION_KEY, NODE_ENV.
 */
const {readFileSync, existsSync} = require('fs');
const {resolve} = require('path');

const appJson = require('./app.json');

function loadEnvFile(filename) {
  const path = resolve(__dirname, filename);
  if (!existsSync(path)) {
    return {};
  }
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

function buildRuntimeEnv() {
  const envFile = process.env.ENV_FILE || '.env.dentalapp';
  const fileEnv = loadEnvFile(envFile);
  const merged = {...fileEnv};
  for (const key of Object.keys(fileEnv)) {
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

module.exports = () => {
  const env = buildRuntimeEnv();
  return {
    expo: {
      ...appJson.expo,
      extra: {
        ...appJson.expo.extra,
        env,
      },
    },
  };
};
