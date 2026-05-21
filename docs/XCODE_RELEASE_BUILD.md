# Xcode Release → πραγματικό iPhone

> Η δική σου ροή: **Release** scheme, **χωρίς** `npm start` / Metro.

## Πριν κάθε Release build

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
npm run env:check:prod
```

Χρειάζεται `.env.dentalapp` με πραγματικά `JWT_SECRET` και `ENCRYPTION_KEY` (βλ. [PRODUCTION_ENV.md](./PRODUCTION_ENV.md)).

## Στο Xcode

1. Άνοιγμα: `ios/DentalPracticeManagement.xcworkspace` (όχι `.xcodeproj`)
2. **Product → Scheme → Edit Scheme → Run → Build Configuration: Release**
3. **Signing & Capabilities**: Team σου, μοναδικό Bundle ID αν χρειάζεται
4. Σύνδεση iPhone (USB) → διάλεξε συσκευή πάνω από το ▶️
5. **Product → Clean Build Folder** (αν άλλαξες `.env` ή κώδικα)
6. **▶ Run**

Δεν τρέχεις `npm start` — το JavaScript μπαίνει μέσα στο build (φάση «Bundle React Native code and images»).

## Πρώτη εγκατάσταση στο iPhone

- **Ρυθμίσεις → Γενικά → VPN & διαχείριση συσκευής** → εμπιστοσύνη developer
- **Λειτουργία προγραμματιστή** ON (iOS 16+)

## Login

- Προεπιλογή: `admin` / `admin123`
- Μετά A5: ο παλιός hash αναβαθμίζεται αυτόματα στο πρώτο επιτυχημένο login

## Αν η app κλείνει αμέσως

1. Console στο Xcode → ψάξε `Environment configuration errors`
2. `npm run env:check:prod` και ξανά **Clean + Run**
3. Βεβαιώσου ότι scheme είναι **Release** (όχι Debug χωρίς Metro)

## TestFlight / App Store (A4 cloud)

```bash
npm run env:check:prod
eas build --profile production --platform ios
```

Δείτε [EXPO_BUILD_GUIDE.md](../EXPO_BUILD_GUIDE.md).
