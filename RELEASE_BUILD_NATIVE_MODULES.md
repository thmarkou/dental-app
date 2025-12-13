# Release Build - Native Modules Issue

## Το Πρόβλημα

Στο Release build, το error "Cannot find native module 'ExpoSQLite'" συμβαίνει γιατί:

1. **Native modules** χρειάζονται proper linking
2. **Release build** δεν έχει debug symbols
3. **expo-sqlite** native module μπορεί να μην είναι properly linked

## Λύσεις

### 1. Rebuild με Pods (Προτεινόμενη)

```bash
cd ios
pod install
cd ..
```

Στη συνέχεια στο Xcode:
- **Product** → **Clean Build Folder** (⇧⌘K)
- **Product** → **Build** (⌘B)

### 2. Ελέγξτε Build Settings

Στο Xcode:
1. **Project** → **Build Settings**
2. Αναζητήστε **"Other Linker Flags"**
3. Βεβαιωθείτε ότι περιέχει `-ObjC`

### 3. Ελέγξτε Podfile

Βεβαιωθείτε ότι το `expo-sqlite` είναι στο Podfile:
```ruby
# Should be auto-linked by Expo
```

### 4. Debug vs Release Configuration

**Για development:**
- Χρησιμοποιήστε **Debug** build
- Metro bundler + hot reload
- Native modules λειτουργούν κανονικά

**Για production testing:**
- **Release** build με bundled JavaScript
- Native modules πρέπει να είναι properly linked
- Rebuild με `pod install`

## Προτεινόμενη Ροή

### Development:
```bash
# Terminal: Metro bundler
npm start

# Xcode: Debug build (⌘R)
```

### Production Testing:
```bash
# 1. Reinstall pods
cd ios && pod install && cd ..

# 2. Bundle JavaScript
./scripts/bundle-ios.sh

# 3. Xcode: Release build
# Product → Clean Build Folder
# Product → Build
# Product → Run
```

## Αν το Πρόβλημα Συνεχίζεται

1. **Ελέγξτε το Xcode build log:**
   - View → Navigators → Show Report Navigator
   - Δείτε για linking errors

2. **Ελέγξτε το Podfile.lock:**
   ```bash
   grep -i "expo-sqlite" ios/Podfile.lock
   ```

3. **Clean build:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock build
   pod install
   cd ..
   ```

4. **Rebuild στο Xcode:**
   - Product → Clean Build Folder
   - Product → Build

## Σημαντικό

Το error handling στο `database.service.ts` τώρα:
- ✅ Χειρίζεται gracefully το missing native module
- ✅ Δεν κάνει crash την εφαρμογή
- ✅ Εμφανίζει helpful error messages

Η εφαρμογή θα συνεχίσει να λειτουργεί χωρίς database functionality.

