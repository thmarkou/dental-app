# Production environment (A3 / Φάση 5)

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
npm run release:preflight
```

Restart Metro after changing `.env.dentalapp` (`npm start`).

## 2. What gets validated

| Variable | Production rule |
|----------|-----------------|
| `JWT_SECRET` | Set, not example/dev placeholder, ≥ 32 chars recommended |
| `ENCRYPTION_KEY` | Set, ≥ 32 chars, not placeholder |
| `NODE_ENV` | `production` for EAS production/preview profiles |

Release builds (`__DEV__ === false`) **throw** if weak secrets are still bundled.

Optional (feature flags — see `env.dentalapp.example`):

| Variable | When required |
|----------|----------------|
| `FEATURE_SMS_REMINDERS` | `true` → needs `SMS_GATEWAY_API_KEY` |
| `FEATURE_REMOTE_PUSH` | `true` → needs valid `extra.eas.projectId` in `app.json` |

## 3. EAS build profiles (`eas.json`)

| Profile | Χρήση | Distribution | `NODE_ENV` | Auto build # |
|---------|--------|--------------|------------|--------------|
| **development** | Dev client + simulator | internal | (dev file) | όχι |
| **preview** | TestFlight / internal testers | internal | production | ναι |
| **production** | App Store | store | production | ναι |

Commands:

```bash
npm run release:preflight
eas build --profile preview --platform ios      # TestFlight
eas build --profile production --platform ios # App Store
```

Android:

```bash
eas build --profile preview --platform android
eas build --profile production --platform android
```

## 4. EAS secrets (cloud — never in Git)

Create once per Expo project:

```bash
eas secret:create --scope project --name JWT_SECRET --value "<from npm run env:secrets>"
eas secret:create --scope project --name ENCRYPTION_KEY --value "<64-char hex>"
# Optional if SMS enabled in production:
eas secret:create --scope project --name SMS_GATEWAY_API_KEY --value "<provider key>"
```

`eas.json` production/preview set `NODE_ENV=production`. `app.config.js` merges EAS `process.env` over `.env.dentalapp`.

List secrets: `eas secret:list`

## 5. App Store Connect / `eas submit`

Πριν το πρώτο submit, συμπλήρωσε στο `eas.json` → `submit.production.ios` (ή πέρασέ τα interactive):

- `appleId` — Apple ID email
- `ascAppId` — App Store Connect app ID
- `appleTeamId` — Developer Team ID

```bash
eas submit --platform ios --profile production --latest
```

Λεπτομέρειες TestFlight: [XCODE_RELEASE_BUILD.md](./XCODE_RELEASE_BUILD.md).

## 6. Scripts

| Command | Purpose |
|---------|---------|
| `npm run env:setup` | Create `.env.dentalapp` + generate secrets |
| `npm run env:secrets` | Print new JWT/ENCRYPTION values |
| `npm run env:secrets -- --write` | Write secrets into `.env.dentalapp` |
| `npm run env:check` | Dev-friendly validation |
| `npm run env:check:prod` | Strict (production) validation |
| `npm run release:preflight` | env:check:prod + type-check + tests |

## 7. Versioning

Marketing version vs build number: [VERSIONING.md](./VERSIONING.md).

Release notes template: [RELEASE_NOTES_TEMPLATE.md](./RELEASE_NOTES_TEMPLATE.md).

## 8. Related

- Xcode USB Release: [XCODE_RELEASE_BUILD.md](./XCODE_RELEASE_BUILD.md)
- EAS overview: [EXPO_BUILD_GUIDE.md](../EXPO_BUILD_GUIDE.md)
