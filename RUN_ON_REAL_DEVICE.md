# Τρέξιμο σε Πραγματική Συσκευή (Real Device)

## Προαπαιτούμενα

1. **iPhone/iPad** με USB cable
2. **Apple ID** (δωρεάν για development)
3. **Xcode** εγκατεστημένο
4. **macOS** (απαιτείται για iOS development)

## Βήματα

### 1. Σύνδεση Συσκευής

1. Συνδέστε το iPhone/iPad στο Mac με USB cable
2. Ξεκλειδώστε το device
3. Στο device, επιλέξτε **"Trust This Computer"** όταν ερωτηθεί

### 2. Επιλογή Device στο Xcode

1. Ανοίξτε το project στο Xcode:
   ```bash
   open ios/DentalPracticeManagement.xcworkspace
   ```

2. Στο Xcode:
   - Κάντε click στο device selector (κοντά στο Run button)
   - Επιλέξτε το **πραγματικό device** σας (όχι simulator)

### 3. Developer Account Setup

1. Στο Xcode → **Preferences** → **Accounts**
2. Προσθέστε το **Apple ID** σας (Sign In)
3. Επιλέξτε το team (θα είναι "Personal Team" αν δεν έχετε paid account)

### 4. Bundle Identifier & Signing

1. Στο Xcode, επιλέξτε το project → **DentalPracticeManagement** target
2. Πηγαίνετε στο **Signing & Capabilities** tab
3. Επιλέξτε **Automatically manage signing**
4. Επιλέξτε το **Team** σας
5. Το **Bundle Identifier** πρέπει να είναι μοναδικό (π.χ. `com.yourname.dentalapp`)

### 5. Build & Run

**Επιλογή 1: Από Xcode**
1. Επιλέξτε το device από το dropdown
2. Πατήστε **Run** (⌘R) ή click το ▶️ button

**Επιλογή 2: Από Terminal**
```bash
npx expo run:ios --device
```

### 6. Trust Developer στο Device

**Πρώτη φορά που τρέχετε:**
1. Στο device, πηγαίνετε: **Settings** → **General** → **VPN & Device Management**
2. Επιλέξτε το developer profile σας
3. Tap **Trust** → **Trust**

### 7. Ενεργοποίηση Developer Mode (iOS 16+)

Αν το device είναι iOS 16+:
1. **Settings** → **Privacy & Security** → **Developer Mode**
2. Ενεργοποιήστε το **Developer Mode**
3. Restart το device

## Troubleshooting

### "No devices found"
- Ελέγξτε USB connection
- Ελέγξτε αν το device είναι unlocked
- Ελέγξτε αν έχετε επιλέξει "Trust This Computer"

### "Code signing error"
- Ελέγξτε το Bundle Identifier (πρέπει να είναι μοναδικό)
- Ελέγξτε το Team στο Signing & Capabilities
- Δοκιμάστε να clean build: Product → Clean Build Folder (⇧⌘K)

### "Unable to install app"
- Ελέγξτε αν έχετε trust το developer profile
- Ελέγξτε αν το Developer Mode είναι enabled (iOS 16+)
- Ελέγξτε το available storage στο device

### "Provisioning profile error"
- Στο Xcode, πηγαίνετε: Product → Clean Build Folder
- Δοκιμάστε να rebuild

## Εναλλακτική: Expo Go (χωρίς development build)

Αν θέλετε γρήγορη δοκιμή χωρίς development build:
```bash
npm start
# Scan QR code με Expo Go app
```

**Προσοχή:** Expo Go δεν υποστηρίζει native modules όπως expo-sqlite!

## Επόμενα Βήματα

Μόλις τρέξει στο device:
1. Η εφαρμογή θα εγκατασταθεί
2. Το database θα λειτουργήσει (expo-sqlite)
3. Μπορείτε να κάνετε live reload με ⌘R στο Xcode

