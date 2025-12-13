# Fix Database Issue - expo-sqlite Native Module

## Το Πρόβλημα

Το `expo-sqlite` native module δεν είναι properly linked, οπότε βλέπετε το warning:
```
⚠️ Database not available. This usually means:
1. Running in Expo Go (use development build instead)
2. Native module not properly linked
3. Need to rebuild: npx expo run:ios
```

## Λύση: Rebuild με Pods

### Βήμα 1: Clean Build
```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Clean iOS build
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
```

### Βήμα 2: Reinstall Pods
```bash
cd ios
pod install
cd ..
```

### Βήμα 3: Rebuild App
```bash
# Option A: Expo rebuild
npx expo prebuild --clean
npx expo run:ios

# Option B: Xcode rebuild
# 1. Open Xcode
# 2. Product → Clean Build Folder (⇧⌘K)
# 3. Product → Build (⌘B)
# 4. Product → Run (⌘R)
```

## Ελέγχος ότι Λειτουργεί

Μετά το rebuild, στο Xcode console θα πρέπει να δείτε:
```
✅ Database initialized successfully
```

Αντί για:
```
⚠️ Database not available...
```

## Αν Συνεχίζει το Πρόβλημα

### 1. Ελέγξτε ότι το Plugin είναι στο app.json
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

### 2. Ελέγξτε ότι το Package είναι Installed
```bash
npm list expo-sqlite
```

### 3. Ελέγξτε ότι το Pod είναι Installed
```bash
cd ios
pod list | grep -i sqlite
```

### 4. Full Clean Rebuild
```bash
# Clean everything
rm -rf node_modules
rm -rf ios/build ios/Pods ios/Podfile.lock
rm -rf android/build android/app/build

# Reinstall
npm install
cd ios && pod install && cd ..

# Rebuild
npx expo prebuild --clean
npx expo run:ios
```

## Debug Mode vs Release Mode

**Σημαντικό:** Για development, χρησιμοποιήστε **Debug** mode:
- Metro bundler connection
- Native modules λειτουργούν καλύτερα
- Hot reload

**Release mode** μπορεί να έχει issues με native modules αν δεν είναι properly bundled.

## Quick Fix Script

```bash
#!/bin/bash
cd /Users/fanis/AIProjects/cursor/dentalapp

echo "🧹 Cleaning..."
rm -rf ios/build ios/Pods ios/Podfile.lock

echo "📦 Installing pods..."
cd ios && pod install && cd ..

echo "🔨 Rebuilding..."
npx expo prebuild --clean

echo "✅ Done! Now run: npx expo run:ios"
```

## Notes

- Το `expo-sqlite` χρειάζεται **development build**, όχι Expo Go
- Μετά το `prebuild`, χρειάζεται **pod install** για iOS
- Το native module link γίνεται αυτόματα με `expo prebuild` + `pod install`

