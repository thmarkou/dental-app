# Fix: Developer Mode ON αλλά δεν βλέπω Device Management

## Το Πρόβλημα
- ✅ Developer Mode είναι **ON** (ενεργοποιημένο)
- ❌ Αλλά στο **Settings → General → VPN & Device Management** βλέπεις **μόνο VPN**

Αυτό σημαίνει ότι:
- Το developer profile **δεν έχει δημιουργηθεί** ακόμα
- Το app **δεν έχει εγκατασταθεί** σωστά
- Το **signing** δεν λειτουργεί σωστά

## Λύση (Βήμα-Βήμα)

### Βήμα 1: Διαγραφή Παλιού App (Αν Υπάρχει)

1. Στο iPhone, πάτα και κράτησε το icon της εφαρμογής (αν υπάρχει)
2. Επιλέξτε **"Remove App"** → **"Delete App"**
3. Αυτό θα διαγράψει το παλιό app με το λάθος signing

### Βήμα 2: Ελέγχος Signing στο Xcode

1. Άνοιξε το project:
   ```bash
   cd /Users/fanis/AIProjects/cursor/dentalapp
   open ios/DentalPracticeManagement.xcworkspace
   ```

2. Στο Xcode:
   - Επιλέξτε το **DentalPracticeManagement** project (αριστερά)
   - Επιλέξτε το **DentalPracticeManagement** target
   - Πηγαίνετε στο **Signing & Capabilities** tab
   - Ελέγξτε:
     - ✅ **Automatically manage signing** (ενεργοποιημένο)
     - **Team**: Επιλέξτε το Team σας
       - Αν δεν βλέπεις Team:
         - **Xcode → Preferences** (⌘,)
         - **Accounts** tab
         - Κάντε **+** → **Apple ID**
         - Προσθέστε το Apple ID σας
         - Κάντε click στο Team → **Download Manual Profiles**
     - **Bundle Identifier**: `com.dentalapp.practice`

### Βήμα 3: Clean Build Folder

1. Στο Xcode: **Product → Clean Build Folder** (⇧⌘K)
2. Περίμενε να ολοκληρωθεί

### Βήμα 4: Ελέγχος Console για Errors

1. Στο Xcode: **View → Debug Area → Show Debug Area** (⇧⌘Y)
2. Κάντε scroll στο console και δες αν υπάρχουν errors
3. Συχνά errors:
   - **"No signing certificate"**: Πρόσθεσε Apple ID
   - **"Provisioning profile not found"**: Download Manual Profiles
   - **"Code signing error"**: Ελέγξτε το Team

### Βήμα 5: Build & Run

1. Επιλέξτε το **iPhone** σας από το device selector (κοντά στο Run button)
2. Κάντε **Run** (⌘R)
3. Περίμενε να ολοκληρωθεί:
   - Build
   - Installation στο iPhone

### Βήμα 6: Ελέγχος αν Εγκαταστάθηκε

Μετά το Run:

1. Στο iPhone, δες αν υπάρχει icon της εφαρμογής
2. Αν υπάρχει, πάτα πάνω του
3. Αν λέει "Untrusted Developer", πήγαινε στο βήμα 7
4. Αν δεν ανοίγει, δες το βήμα 8

### Βήμα 7: Trust Developer Profile

Αν το app εγκαταστάθηκε αλλά δεν ανοίγει:

1. Στο iPhone: **Settings → General → VPN & Device Management**
2. Τώρα θα πρέπει να βλέπεις **Device Management** section
3. Tap στο **Device Management**
4. Θα βλέπεις το developer profile σου (το όνομα σου ή "Apple Development")
5. Tap πάνω του → **Trust** → **Trust**

### Βήμα 8: Αν Ακόμα Δεν Βλέπεις Device Management

#### Επιλογή A: Χρήση Expo CLI (Πιο Αξιόπιστο)

Αντί για Xcode, δοκίμασε:

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Terminal 1: Start Metro (αφήστε το να τρέχει)
npm start

# Terminal 2: Run on device (αυτό κάνει automatic signing)
npx expo run:ios --device
```

Αυτό θα:
- Κάνει automatic signing
- Εγκαταστήσει το app
- Δημιουργήσει το developer profile
- Εμφανίσει το Device Management

#### Επιλογή B: Complete Reset

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

### Βήμα 9: Ελέγχος Devices and Simulators

1. Στο Xcode: **Window → Devices and Simulators** (⇧⌘2)
2. Επιλέξτε το iPhone σας
3. Κάντε right-click → **Show Provisioning Profiles**
4. Αν βλέπεις profiles, το πρόβλημα είναι στο iPhone
5. Αν δεν βλέπεις profiles, το πρόβλημα είναι στο signing

## Συχνές Ερωτήσεις

**Q: Γιατί δεν βλέπω Device Management ακόμα;**
A: Επειδή το developer profile δεν έχει δημιουργηθεί. Κάνε build & run από το Xcode ή χρησιμοποίησε `npx expo run:ios --device`.

**Q: Το app εγκαταστάθηκε αλλά δεν ανοίγει;**
A: Πρέπει να trust το developer profile στο **Settings → General → VPN & Device Management → Device Management**.

**Q: Βλέπω signing errors στο Xcode;**
A: Ελέγξτε:
- Xcode → Preferences → Accounts → Apple ID added
- Xcode → Target → Signing & Capabilities → Team selected
- Download Manual Profiles

**Q: Ποια είναι η πιο αξιόπιστη μέθοδος;**
A: Χρήση `npx expo run:ios --device` - κάνει automatic signing και είναι πιο αξιόπιστο.

## Verification Checklist

- [ ] Παλιό app διαγραμμένο από iPhone (αν υπήρχε)
- [ ] Xcode → Preferences → Accounts → Apple ID added
- [ ] Xcode → Target → Signing & Capabilities → Team selected
- [ ] Xcode → Target → Signing & Capabilities → Automatically manage signing ✅
- [ ] Clean Build Folder done (⇧⌘K)
- [ ] Build completed successfully (⌘B)
- [ ] Run completed successfully (⌘R)
- [ ] App installed on iPhone (icon visible)
- [ ] iPhone → Settings → General → VPN & Device Management → Device Management section visible
- [ ] Developer profile trusted

## Troubleshooting

### Error: "No signing certificate found"
**Solution**: 
- Xcode → Preferences → Accounts → Select Apple ID → Download Manual Profiles

### Error: "Provisioning profile expired"
**Solution**:
- Xcode → Preferences → Accounts → Select Team → Download Manual Profiles
- Clean Build Folder και rebuild

### Error: "Unable to install app"
**Solution**:
- Ελέγξτε αν το iPhone είναι unlocked
- Ελέγξτε το available storage
- Διαγράψτε παλιό app και rebuild

### Error: "Code signing error"
**Solution**:
- Ελέγξτε το Bundle Identifier (πρέπει να είναι μοναδικό)
- Ελέγξτε το Team στο Signing & Capabilities
- Δοκίμασε να αλλάξεις το Bundle Identifier σε κάτι πιο unique (π.χ. `com.yourname.dentalapp`)

---

**Σημαντικό**: Αν το Xcode δυσκολεύει, χρησιμοποίησε `npx expo run:ios --device` - είναι πιο αξιόπιστο!

