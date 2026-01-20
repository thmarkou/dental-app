# Fix: Βλέπω μόνο VPN, όχι Device Management

## Το Πρόβλημα
Στο **Settings → General → VPN & Device Management** βλέπεις **μόνο VPN**, όχι το **Device Management** section.

Αυτό σημαίνει ότι:
- Το developer profile **δεν έχει δημιουργηθεί** ακόμα
- Το app **δεν έχει εγκατασταθεί** σωστά
- Το **Developer Mode** μπορεί να μην είναι enabled (iOS 16+)

## Λύση (Βήμα-Βήμα)

### Βήμα 1: Ενεργοποίηση Developer Mode (iOS 16+)

**Αυτό είναι ΚΡΙΣΙΜΟ!** Χωρίς Developer Mode, δεν θα εμφανιστεί ποτέ το Device Management.

1. Στο iPhone: **Settings** → **Privacy & Security**
2. Κάνε scroll προς τα κάτω
3. Βρες το **Developer Mode** (αν δεν το βλέπεις, δες παρακάτω)
4. Ενεργοποίησε το **Developer Mode** toggle
5. Θα σου ζητήσει να **Restart** το iPhone → **Restart**

**ΣΗΜΑΝΤΙΚΟ**: Αν δεν βλέπεις το Developer Mode option:
- Πρέπει πρώτα να κάνεις build από το Xcode
- Μετά το πρώτο build attempt, το Developer Mode option θα εμφανιστεί

### Βήμα 2: Ελέγχος Xcode Signing

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

### Βήμα 3: Clean και Build

1. Στο Xcode:
   - **Product → Clean Build Folder** (⇧⌘K)
   - Περίμενε να ολοκληρωθεί

2. Επιλέξτε το **iPhone** σας από το device selector (κοντά στο Run button)

3. Κάντε **Build** (⌘B) - μόνο build, όχι run ακόμα
   - Περίμενε να ολοκληρωθεί
   - Αν υπάρχουν errors, δες το console και διορθώσε τα

### Βήμα 4: Run (Install)

1. Μετά το successful build, κάντε **Run** (⌘R)
2. Περίμενε να ολοκληρωθεί:
   - Build
   - Installation στο iPhone
3. Αν βλέπεις error, δες το console στο Xcode

### Βήμα 5: Ελέγχος Developer Mode (Μετά το Build)

Μετά το πρώτο build attempt:

1. Στο iPhone: **Settings** → **Privacy & Security**
2. Τώρα θα πρέπει να βλέπεις **Developer Mode** option
3. Ενεργοποίησε το → **Restart**

### Βήμα 6: Ελέγχος Device Management

Μετά το restart και το δεύτερο build:

1. Στο iPhone: **Settings** → **General** → **VPN & Device Management**
2. Τώρα θα πρέπει να βλέπεις **2 sections**:
   - **VPN** (το υπάρχον)
   - **Device Management** (το νέο!)
3. Tap στο **Device Management**
4. Θα βλέπεις το developer profile σου
5. Tap πάνω του → **Trust** → **Trust**

### Βήμα 7: Αν Ακόμα Δεν Λειτουργεί

#### Επιλογή A: Χρήση Expo CLI (Πιο Απλό)

Αντί για Xcode, δοκίμασε:

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp

# Terminal 1: Start Metro
npm start

# Terminal 2: Run on device (αυτό κάνει automatic signing)
npx expo run:ios --device
```

Αυτό θα:
- Κάνει automatic signing
- Εγκαταστήσει το app
- Δημιουργήσει το developer profile
- Ενεργοποιήσει το Developer Mode option

#### Επιλογή B: Manual Check

1. Στο Xcode: **Window → Devices and Simulators** (⇧⌘2)
2. Επιλέξτε το iPhone σας
3. Κάντε right-click → **Show Provisioning Profiles**
4. Αν βλέπεις profiles, το πρόβλημα είναι στο iPhone
5. Δοκίμασε:
   - Restart το iPhone
   - Διαγραφή όλων των apps που έχουν developer signing
   - Rebuild

## Συχνές Ερωτήσεις

**Q: Γιατί δεν βλέπω Developer Mode option;**
A: Πρέπει πρώτα να κάνεις build attempt από το Xcode. Μετά το πρώτο build, το option θα εμφανιστεί.

**Q: Γιατί βλέπω μόνο VPN;**
A: Επειδή δεν έχει δημιουργηθεί developer profile ακόμα. Κάνε build από το Xcode πρώτα.

**Q: Πόσο χρόνο παίρνει;**
A: Μετά το πρώτο build, restart, και δεύτερο build, το Device Management θα εμφανιστεί.

**Q: Χρειάζομαι paid Apple Developer account;**
A: Όχι! Το **Personal Team** (free) είναι αρκετό.

## Verification Checklist

- [ ] Xcode → Preferences → Accounts → Apple ID added
- [ ] Xcode → Target → Signing & Capabilities → Team selected
- [ ] Xcode → Target → Signing & Capabilities → Automatically manage signing ✅
- [ ] Build completed successfully (⌘B)
- [ ] Run completed successfully (⌘R)
- [ ] iPhone → Settings → Privacy & Security → Developer Mode visible
- [ ] Developer Mode enabled → iPhone restarted
- [ ] iPhone → Settings → General → VPN & Device Management → Device Management section visible
- [ ] Developer profile trusted

## Troubleshooting

### Error: "No signing certificate"
**Solution**: Xcode → Preferences → Accounts → Add Apple ID → Download Manual Profiles

### Error: "Provisioning profile expired"
**Solution**: Xcode → Preferences → Accounts → Select Team → Download Manual Profiles

### Error: "Unable to install app"
**Solution**: 
1. Ενεργοποίησε Developer Mode
2. Restart iPhone
3. Rebuild

### Error: "Device not registered"
**Solution**:
1. Ελέγξτε αν το iPhone είναι unlocked
2. Ελέγξτε αν έχετε επιλέξει "Trust This Computer"
3. Reconnect το iPhone

---

**Σημαντικό**: Η σειρά είναι:
1. Build από Xcode (για να εμφανιστεί Developer Mode option)
2. Enable Developer Mode → Restart
3. Build & Run ξανά
4. Device Management θα εμφανιστεί

