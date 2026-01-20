# Fix: Developer Profile Not Found on iPhone

## Το Πρόβλημα
Δεν βλέπεις το developer profile στο **Settings → General → VPN & Device Management** (ή **Device Management**)

## Λύσεις (Δοκίμασε με τη σειρά)

### 1. Ελέγχος αν το Profile Δημιουργήθηκε

Το developer profile δημιουργείται **αυτόματα** όταν κάνεις build από το Xcode. Αν δεν το βλέπεις, σημαίνει ότι:

#### Α) Το Build Δεν Ολοκληρώθηκε Σωστά
1. Στο Xcode, κάνε **Product → Clean Build Folder** (⇧⌘K)
2. Επιλέξτε το iPhone σας από το device selector
3. Κάντε **Build** (⌘B) - μόνο build, όχι run
4. Περίμενε να ολοκληρωθεί το build
5. Αν υπάρχουν errors, δες το console και διορθώσε τα

#### Β) Το App Δεν Εγκαταστάθηκε
1. Μετά το build, κάντε **Run** (⌘R)
2. Περίμενε να ολοκληρωθεί η εγκατάσταση
3. Αν βλέπεις error "Unable to install", δες παρακάτω

### 2. Ελέγχος Signing στο Xcode

#### Βήμα 1: Άνοιξε το Project
```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
open ios/DentalPracticeManagement.xcworkspace
```

#### Βήμα 2: Configure Signing
1. Στο Xcode, επιλέξτε το **DentalPracticeManagement** project (αριστερά)
2. Επιλέξτε το **DentalPracticeManagement** target
3. Πηγαίνετε στο **Signing & Capabilities** tab
4. Ελέγξτε:
   - ✅ **Automatically manage signing** (ενεργοποιημένο)
   - **Team**: Επιλέξτε το Team σας
     - Αν δεν βλέπεις Team:
       - **Xcode → Preferences** (⌘,)
       - **Accounts** tab
       - Κάντε **+** → **Apple ID**
       - Προσθέστε το Apple ID σας
       - Κάντε click στο Team → **Download Manual Profiles**
   - **Bundle Identifier**: `com.dentalapp.practice`

#### Βήμα 3: Ελέγχος Build Configuration
1. Στο πάνω μέρος, δες το **Scheme** selector
2. Επιλέξτε **DentalPracticeManagement** → **Edit Scheme...**
3. Στο **Run** → **Build Configuration**: Επιλέξτε **Debug**
4. Κλείστε το window

### 3. Build και Install

1. **Clean Build Folder**: **Product → Clean Build Folder** (⇧⌘K)
2. Επιλέξτε το **iPhone** σας από το device selector
3. Κάντε **Run** (⌘R)
4. Περίμενε το build και installation να ολοκληρωθούν

### 4. Ελέγχος στο iPhone

Μετά το installation:

1. **Settings** → **General** → **VPN & Device Management** (ή **Device Management**)
2. Θα πρέπει να βλέπεις ένα section με το όνομα σου ή "Apple Development"
3. Tap πάνω του → **Trust** → **Trust**

### 5. Αν Ακόμα Δεν Το Βλέπεις

#### Επιλογή A: Developer Mode (iOS 16+)
Αν το iPhone είναι iOS 16 ή νεότερο:

1. **Settings** → **Privacy & Security** → **Developer Mode**
2. Ενεργοποιήστε το **Developer Mode**
3. Restart το iPhone
4. Όταν ανοίξει, θα σου ζητήσει confirmation → **Restart**

Μετά το restart:
1. Κάνε build ξανά από το Xcode
2. Πήγαινε στο **Settings → General → VPN & Device Management**
3. Τώρα θα πρέπει να βλέπεις το developer profile

#### Επιλογή B: Manual Profile Installation
1. Στο Xcode, μετά το build, πήγαινε στο:
   - **Window → Devices and Simulators** (⇧⌘2)
2. Επιλέξτε το iPhone σας
3. Κάντε right-click → **Show Provisioning Profiles**
4. Αν βλέπεις profiles, το πρόβλημα είναι στο iPhone
5. Δοκίμασε να διαγράψεις το app από το iPhone και rebuild

#### Επιλογή C: Χρήση Expo CLI
Αντί για Xcode, δοκίμασε:

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Terminal 1: Start Metro
npm start

# Terminal 2: Run on device (αυτό θα κάνει automatic signing)
npx expo run:ios --device
```

Αυτό θα:
- Κάνει automatic signing
- Εγκαταστήσει το app
- Δημιουργήσει το developer profile

### 6. Ελέγχος Console για Errors

Στο Xcode:
1. **View → Debug Area → Show Debug Area** (⇧⌘Y)
2. Κάντε build και δες τα error messages

Συχνά errors:
- **"No signing certificate"**: Πρόσθεσε Apple ID στο Xcode Preferences
- **"Provisioning profile not found"**: Download Manual Profiles
- **"Device not registered"**: Ελέγξτε αν το iPhone είναι unlocked και trusted

### 7. Complete Reset (Last Resort)

Αν τίποτα δεν λειτουργεί:

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# 1. Clean everything
rm -rf ios/build
rm -rf ios/Pods
rm -rf Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 2. Rebuild iOS project
npx expo prebuild --clean --platform ios

# 3. Install pods
cd ios
pod install
cd ..

# 4. Open in Xcode
open ios/DentalPracticeManagement.xcworkspace
```

Στο Xcode:
1. **Product → Clean Build Folder** (⇧⌘K)
2. Configure Signing (βλέπε βήμα 2)
3. Build & Run (⌘R)

## Verification Checklist

- [ ] Xcode → Preferences → Accounts → Apple ID added
- [ ] Xcode → Target → Signing & Capabilities → Team selected
- [ ] Xcode → Target → Signing & Capabilities → Automatically manage signing ✅
- [ ] iPhone → Settings → Privacy & Security → Developer Mode enabled (iOS 16+)
- [ ] iPhone → Settings → General → VPN & Device Management → Developer profile visible
- [ ] Developer profile trusted
- [ ] Build completed successfully
- [ ] App installed on iPhone

## Συχνές Ερωτήσεις

**Q: Γιατί δεν βλέπω το developer profile;**
A: Συνήθως επειδή:
- Το build δεν ολοκληρώθηκε
- Το Developer Mode δεν είναι enabled (iOS 16+)
- Το app δεν εγκαταστάθηκε σωστά

**Q: Πρέπει να έχω paid Apple Developer account;**
A: Όχι! Το **Personal Team** (free) είναι αρκετό για development.

**Q: Πόσο διαρκεί το developer profile;**
A: 7 μέρες για Personal Team. Μετά από 7 μέρες, πρέπει να rebuild.

**Q: Μπορώ να χρησιμοποιήσω το app χωρίς internet;**
A: Ναι, μετά την εγκατάσταση, το app λειτουργεί offline.

---

**Σημαντικό**: Μετά από κάθε αλλαγή, κάντε **Clean Build Folder** και rebuild!

