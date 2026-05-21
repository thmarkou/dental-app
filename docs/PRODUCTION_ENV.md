# Production environment (A3)

Secrets are **not** committed. They load from `.env.dentalapp` at Metro/build time via `app.config.js` → `expo.extra.env` → `config/env.config.ts`.

## 1. Local setup (first time)

```bash
cp env.dentalapp.example .env.dentalapp
npm run env:secrets -- --write
npm run env:check
```

For release validation:

```bash
# In .env.dentalapp set: NODE_ENV=production
npm run env:check:prod
```

Restart Metro after changing `.env.dentalapp` (`npm start`).

## 2. What gets validated

| Variable | Production rule |
|----------|-----------------|
| `JWT_SECRET` | Set, not example/dev placeholder, ≥ 32 chars recommended |
| `ENCRYPTION_KEY` | Set, ≥ 32 chars, not placeholder |
| `NODE_ENV` | `production` for EAS production profile |

Release builds (`__DEV__ === false`) **throw** if weak secrets are still bundled.

## 3. EAS cloud build

Set secrets (never in Git):

```bash
eas secret:create --scope project --name JWT_SECRET --value "<from npm run env:secrets>"
eas secret:create --scope project --name ENCRYPTION_KEY --value "<64-char hex>"
```

`eas.json` production profile sets `NODE_ENV=production`. `app.config.js` merges EAS `process.env` over the file.

Before build:

```bash
npm run env:check:prod
eas build --profile production --platform ios
```

## 4. Scripts

| Command | Purpose |
|---------|---------|
| `npm run env:setup` | Create `.env.dentalapp` + generate secrets |
| `npm run env:secrets` | Print new JWT/ENCRYPTION values |
| `npm run env:secrets -- --write` | Write secrets into `.env.dentalapp` |
| `npm run env:check` | Dev-friendly validation |
| `npm run env:check:prod` | Strict (production) validation |

## 5. Related

- **A5** (next): bcrypt password hashing in `auth.service.ts`
- **A4**: [EXPO_BUILD_GUIDE.md](../EXPO_BUILD_GUIDE.md)
