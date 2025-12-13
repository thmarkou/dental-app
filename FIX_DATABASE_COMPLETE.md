# Complete Database Fix - expo-sqlite

## Το Πρόβλημα

Το database δεν λειτουργεί:
```
⚠️ Database not available. This usually means:
1. Running in Expo Go (use development build instead)
2. Native module not properly linked
3. Need to rebuild: npx expo run:ios
```

## Complete Fix - Step by Step

### Βήμα 1: Clean Everything ✅

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Clean iOS build artifacts
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
```

### Βήμα 2: Rebuild Native Project ✅

```bash
# Rebuild iOS project with all native modules
npx expo prebuild --clean --platform ios
```

Αυτό θα:
- Δημιουργήσει το iOS project από την αρχή
- Link όλα τα native modules (συμπεριλαμβανομένου expo-sqlite)
- Configure το Podfile

### Βήμα 3: Install Pods ✅

```bash
cd ios
pod install
cd ..
```

Αυτό θα:
- Εγκαταστήσει όλα τα native dependencies
- Link το expo-sqlite module

### Βήμα 4: Rebuild στο Xcode

1. **Open Xcode:**
   ```bash
   open ios/DentalPracticeManagement.xcworkspace
   ```

2. **Clean Build:**
   - Product → Clean Build Folder (⇧⌘K)

3. **Rebuild:**
   - Product → Build (⌘B)

4. **Run:**
   - Product → Run (⌘R)

## Επαλήθευση

### Στο Xcode Console, θα πρέπει να δείτε:

✅ **Success:**
```
Attempting to open database...
Database opened successfully
✅ Database initialized successfully
```

❌ **Failure:**
```
⚠️ Database not available...
```

### Ελέγξτε Pods:

```bash
cd ios
cat Podfile.lock | grep -i "expo.*sqlite"
```

Θα πρέπει να βλέπετε:
```
- ExpoSQLite (16.0.10)
```

## Αν Συνεχίζει το Πρόβλημα

### 1. Ελέγξτε app.json

Βεβαιωθείτε ότι το plugin είναι:
```json
"plugins": [
  [
    "expo-sqlite",
    {
      "enableFTS": true
    }
  ]
]
```

### 2. Ελέγξτε package.json

```bash
npm list expo-sqlite
```

Θα πρέπει να δείτε: `expo-sqlite@16.0.10`

### 3. Full Nuclear Option

```bash
# Clean EVERYTHING
rm -rf node_modules
rm -rf ios android
rm -rf .expo

# Reinstall
npm install

# Rebuild
npx expo prebuild --clean
cd ios && pod install && cd ..

# Run
npx expo run:ios
```

## Debug vs Release

**Σημαντικό:** Χρησιμοποιήστε **Debug** build για development:

- Edit Scheme → Run → Build Configuration → **Debug**
- Native modules λειτουργούν καλύτερα σε Debug
- Metro bundler connection

## Quick Test

Μετά το rebuild, στο app:
1. Login screen θα εμφανιστεί
2. Database warning **ΔΕΝ** θα εμφανιστεί
3. Μπορείτε να κάνετε login (default user θα δημιουργηθεί)

## Success Indicators

✅ App τρέχει χωρίς database warning
✅ Xcode console: "Database initialized successfully"
✅ Login screen λειτουργεί
✅ Database operations λειτουργούν

## Notes

- Το `expo-sqlite` είναι **native module** - χρειάζεται development build
- **ΔΕΝ** λειτουργεί στο Expo Go
- Χρειάζεται `prebuild` + `pod install` για proper linking
- Debug build συνιστάται για development

