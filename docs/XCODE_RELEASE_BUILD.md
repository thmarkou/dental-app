# Xcode Release → πραγματικό iPhone & TestFlight

> Η δική σου ροή USB: **Release** scheme, **χωρίς** `npm start` / Metro.

## Πριν κάθε Release build

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
npm run release:preflight
```

Χρειάζεται `.env.dentalapp` με πραγματικά `JWT_SECRET` και `ENCRYPTION_KEY` (βλ. [PRODUCTION_ENV.md](./PRODUCTION_ENV.md)).

---

## A. Xcode → iPhone (USB)

1. Άνοιγμα: `ios/DentalPracticeManagement.xcworkspace` (όχι `.xcodeproj`)
2. **Product → Scheme → Edit Scheme → Run → Build Configuration: Release**
3. **Signing & Capabilities**: Team σου, Bundle ID `com.dentalapp.practice`
4. Σύνδεση iPhone (USB) → διάλεξε συσκευή πάνω από το ▶️
5. **Product → Clean Build Folder** (αν άλλαξες `.env` ή κώδικα)
6. **▶ Run**

Δεν τρέχεις `npm start` — το JavaScript μπαίνει μέσα στο build.

### Πρώτη εγκατάσταση στο iPhone

- **Ρυθμίσεις → Γενικά → VPN & διαχείριση συσκευής** → εμπιστοσύνη developer
- **Λειτουργία προγραμματιστή** ON (iOS 16+)

### Login

- Προεπιλογή: `admin` / `admin123`

### Αν η app κλείνει αμέσως

1. Console στο Xcode → `Environment configuration errors`
2. `npm run release:preflight` και ξανά **Clean + Run**
3. Scheme **Release** (όχι Debug χωρίς Metro)

---

## B. TestFlight (EAS cloud — συνιστάται για testers)

### Προαπαιτήσεις

- [ ] Apple Developer Program (ενεργό)
- [ ] `eas login` + `eas init` (αν δεν έχει γίνει)
- [ ] `app.json` → `extra.eas.projectId` = πραγματικό EAS project ID (όχι `your-project-id`)
- [ ] EAS secrets: `JWT_SECRET`, `ENCRYPTION_KEY` ([PRODUCTION_ENV.md](./PRODUCTION_ENV.md))
- [ ] `npm run release:preflight` περνάει

### Build preview (internal / TestFlight)

```bash
eas build --profile preview --platform ios
```

Όταν ολοκληρωθεί, κατέβασε το `.ipa` ή συνέχισε με submit.

### Ανέβασμα στο App Store Connect

```bash
eas submit --platform ios --profile production --latest
```

Ή από το [expo.dev](https://expo.dev) dashboard → Builds → Submit.

### Στο App Store Connect

1. **My Apps** → εφαρμογή (ή δημιούργησε νέα με ίδιο bundle ID)
2. **TestFlight** → περίμενε «Processing» (10–30 λεπτά)
3. **Internal Testing** → πρόσθεσε ομάδα / testers (μέχρι 100 internal)
4. Συμπλήρωσε **What to Test** από [RELEASE_NOTES.md](./RELEASE_NOTES.md)
5. Testers λαμβάνουν email → εγκατάσταση μέσω TestFlight app

### External testers (προαιρετικό)

- Απαιτεί **Beta App Review** (πρώτη φορά πιο αργά)
- **External Testing** → ομάδα → submit for review

### Checklist μετά το install (TestFlight)

- [ ] Άνοιγμα app — όχι crash στο splash
- [ ] Login admin
- [ ] Ραντεβού — εβδομάδα / μήνας
- [ ] Ασθενής — λίστα, chart
- [ ] Ρυθμίσεις — αποθήκη, υπενθυμίσεις (push permission αν ζητηθεί)
- [ ] Backup (share sheet)
- [ ] [MANUAL_TEST_CHECKLIST.md](../MANUAL_TEST_CHECKLIST.md) — κρίσιμα σημεία

---

## C. App Store production

```bash
npm run release:preflight
eas build --profile production --platform ios
eas submit --platform ios --profile production --latest
```

Στο App Store Connect: **App Store** tab → έκδοση → metadata → submit for review.

Versioning: [VERSIONING.md](./VERSIONING.md).

---

## D. Xcode Archive (εναλλακτικά χωρίς EAS build)

1. Scheme **Release**, Generic iOS Device ή Any iOS Device
2. **Product → Archive**
3. **Distribute App** → App Store Connect → Upload
4. Συνέχεια από **TestFlight** στο App Store Connect (όπως §B)

---

## Σχετικά

- [EXPO_BUILD_GUIDE.md](../EXPO_BUILD_GUIDE.md)
- [PRODUCTION_ENV.md](./PRODUCTION_ENV.md)
