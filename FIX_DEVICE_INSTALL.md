# Fix "App is no longer available" Error on iPhone

## Το Πρόβλημα
Όταν προσπαθείς να τρέξεις την εφαρμογή στο iPhone από το Xcode, παίρνεις μήνυμα:
**"Dental Practice Management is no longer available"**

## Αιτίες
1. **Code Signing Issues**: Το provisioning profile έχει λήξει ή δεν είναι σωστό
2. **Untrusted Developer**: Το iPhone δεν έχει trust το developer certificate
3. **Old App Version**: Υπάρχει παλιό app με διαφορετικό bundle identifier
4. **Missing Team**: Το Xcode project δεν έχει επιλεγμένο Team

## Λύσεις (Δοκίμασε με τη σειρά)

### 1. Διαγραφή Παλιού App από το iPhone
1. Στο iPhone, πάτα και κράτησε το icon της εφαρμογής
2. Επιλέξτε **"Remove App"** → **"Delete App"**
3. Αυτό θα διαγράψει το παλιό app με το λάθος signing

### 2. Trust Developer Certificate στο iPhone
1. Στο iPhone: **Settings** → **General** → **VPN & Device Management** (ή **Device Management**)
2. Βρες το developer profile σου (θα έχει το όνομα σου ή "Apple Development")
3. Tap **Trust** → **Trust** (θα ζητήσει confirmation)
4. Αν δεν βλέπεις profile, πήγαινε στο βήμα 3

### 3. Ελέγχος Signing στο Xcode

#### Βήμα 1: Άνοιξε το Project
```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
open ios/DentalPracticeManagement.xcworkspace
```

#### Βήμα 2: Επιλογή Target
1. Στο Xcode, κάνε click στο **DentalPracticeManagement** project (αριστερά)
2. Επιλέξτε το **DentalPracticeManagement** target
3. Πηγαίνετε στο **Signing & Capabilities** tab

#### Βήμα 3: Configure Signing
1. **Automatically manage signing**: ✅ (ενεργοποιημένο)
2. **Team**: Επιλέξτε το Team σας (Personal Team ή Organization)
   - Αν δεν βλέπεις Team, πήγαινε στο **Xcode → Preferences → Accounts**
   - Προσθέστε το Apple ID σας
   - Κάντε click στο **Download Manual Profiles** button
3. **Bundle Identifier**: `com.dentalapp.practice` (αφήστε το όπως είναι)

#### Βήμα 4: Ελέγχος Debug Configuration
1. Στο πάνω μέρος, δες το **Scheme** selector
2. Επιλέξτε **Debug** (όχι Release)
3. Ελέγξτε ότι το **Signing & Capabilities** έχει:
   - ✅ Automatically manage signing
   - ✅ Team επιλεγμένο
   - ✅ Bundle Identifier: `com.dentalapp.practice`

### 4. Clean Build Folder
Στο Xcode:
1. **Product** → **Clean Build Folder** (⇧⌘K)
2. Περίμενε να ολοκληρωθεί

### 5. Rebuild και Install
1. Συνδέστε το iPhone στο Mac
2. Επιλέξτε το **iPhone** σας από το device selector (κοντά στο Run button)
3. Πατήστε **Run** (⌘R) ή click το ▶️ button
4. Περίμενε το build να ολοκληρωθεί

### 6. Αν Συνεχίζει το Πρόβλημα

#### Επιλογή A: Δοκίμασε Debug Build
1. Στο Xcode, πάνω αριστερά, δες το **Scheme** selector
2. Επιλέξτε **DentalPracticeManagement** → **Edit Scheme...**
3. Στο **Run** → **Build Configuration**: Επιλέξτε **Debug**
4. Κάντε Clean Build Folder και rebuild

#### Επιλογή B: Διαγραφή Derived Data
```bash
# Στο Terminal
rm -rf ~/Library/Developer/Xcode/DerivedData
```

#### Επιλογή C: Rebuild iOS Project
```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Διαγραφή παλιών build files
rm -rf ios/build
rm -rf ios/Pods
rm -rf Podfile.lock

# Rebuild
npx expo prebuild --clean --platform ios
cd ios
pod install
cd ..

# Άνοιξε στο Xcode
open ios/DentalPracticeManagement.xcworkspace
```

### 7. Ελέγχος Console Logs
Στο Xcode:
1. **View** → **Debug Area** → **Show Debug Area** (⇧⌘Y)
2. Κάντε build και δες τα error messages στο console
3. Αν βλέπεις signing errors, δες το βήμα 3

## Συχνά Errors και Solutions

### Error: "No signing certificate found"
**Solution**: 
- Xcode → Preferences → Accounts → Select Apple ID → Download Manual Profiles

### Error: "Provisioning profile expired"
**Solution**:
- Xcode → Preferences → Accounts → Select Team → Download Manual Profiles
- Clean Build Folder και rebuild

### Error: "Untrusted developer"
**Solution**:
- iPhone → Settings → General → VPN & Device Management → Trust developer

### Error: "App installation failed"
**Solution**:
- Διαγραφή παλιού app από το iPhone
- Clean Build Folder
- Rebuild

## Verification Checklist
- [ ] iPhone συνδεδεμένο και unlocked
- [ ] Trust This Computer επιβεβαιωμένο στο iPhone
- [ ] Xcode → Preferences → Accounts → Apple ID added
- [ ] Xcode → Target → Signing & Capabilities → Team selected
- [ ] Xcode → Target → Signing & Capabilities → Automatically manage signing ✅
- [ ] iPhone → Settings → General → VPN & Device Management → Developer profile trusted
- [ ] Clean Build Folder done
- [ ] Debug build configuration selected
- [ ] iPhone selected as target device

## Αν Τίποτα Δεν Λειτουργεί

### Δοκίμασε Expo Development Build
```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: Run on device
npx expo run:ios --device
```

Αυτό θα κάνει automatic signing και installation.

---

**Σημαντικό**: Μετά από κάθε αλλαγή signing, κάντε **Clean Build Folder** και rebuild!

