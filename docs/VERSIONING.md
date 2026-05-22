# Versioning & build numbers (Φάση 5)

## Δύο αριθμοί

| Πεδίο | Αρχείο | Σημασία | Παράδειγμα |
|-------|--------|---------|------------|
| **Marketing version** | `app.json` → `expo.version` | Τι βλέπει ο χρήστης (App Store «Έκδοση») | `1.0.0` → `1.1.0` |
| **iOS build** | `app.json` → `expo.ios.buildNumber` | `CFBundleVersion` — κάθε upload στο App Store Connect | `1`, `2`, `3`… |
| **Android versionCode** | `app.json` → `expo.android.versionCode` | Ακέραιος — κάθε Play upload | `1`, `2`, `3`… |

**Κανόνας:** η marketing version αλλάζει όταν υπάρχει ορατή αλλαγή για τον χρήστη (features, fixes). Ο build number / versionCode **αυξάνεται πάντα** σε κάθε νέο binary (TestFlight, App Store, internal).

## EAS `autoIncrement`

Στο `eas.json`, τα profiles **preview** και **production** έχουν `"autoIncrement": true`. Σε cloud build το EAS αυξάνει build number / versionCode — δεν χρειάζεται χειροκίνητο bump κάθε φορά.

Για **τοπικό Xcode Release** (USB Run) ενημέρωσε χειροκίνητα το `buildNumber` αν ανεβάζεις το ίδιο `.ipa` ξανά στο App Store Connect.

## Semantic versioning (προτεινόμενο)

- **MAJOR** (`2.0.0`): breaking αλλαγές δεδομένων / ροής
- **MINOR** (`1.1.0`): νέα features (φάσεις πλάνου)
- **PATCH** (`1.0.1`): bugfixes μόνο

## Πριν κάθε release

1. Ενημέρωσε `expo.version` αν αλλάζει η έκδοση για τον χρήστη.
2. Συμπλήρωσε `docs/RELEASE_NOTES.md` (από το template).
3. `npm run release:preflight`
4. Build (Xcode Release ή `eas build`).

## Σχετικά

- [RELEASE_NOTES_TEMPLATE.md](./RELEASE_NOTES_TEMPLATE.md)
- [PRODUCTION_ENV.md](./PRODUCTION_ENV.md)
- [XCODE_RELEASE_BUILD.md](./XCODE_RELEASE_BUILD.md)
