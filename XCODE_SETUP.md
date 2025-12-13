# Xcode Setup για Real Device

## Το "No Bundle URL Present" Error

Αυτό το error σημαίνει ότι το Xcode δεν μπορεί να βρει το JavaScript bundle. Χρειάζεται να τρέξει το **Metro Bundler**.

## Λύση

### Βήμα 1: Τρέξτε το Metro Bundler

**Σε ξεχωριστό terminal:**
```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
npm start
```

Αυτό θα ξεκινήσει το Metro bundler και θα δείξει:
```
Metro waiting on exp://192.168.x.x:8081
```

### Βήμα 2: Στο Xcode

1. **Επιλέξτε το device** σας από το dropdown
2. **Πατήστε Run** (⌘R)

Το Xcode θα:
- Build το native app
- Συνδεθεί στο Metro bundler
- Φορτώσει το JavaScript bundle

## Εναλλακτική: Production Build (χωρίς Metro)

Αν θέλετε standalone build **χωρίς Metro**:

### 1. Build Release Version

Στο Xcode:
1. **Product** → **Scheme** → **Edit Scheme**
2. **Run** → **Build Configuration** → **Release**
3. **Product** → **Archive** (για App Store)
   ή
   **Product** → **Build** (⌘B)

### 2. Bundle JavaScript

Πρέπει να bundle το JS code:
```bash
# Create bundle
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/
```

### 3. Προσθήκη Bundle στο Xcode

1. Στο Xcode, **right-click** στο project
2. **Add Files to "DentalPracticeManagement"...**
3. Επιλέξτε το `main.jsbundle`
4. ✅ **Copy items if needed**
5. ✅ **Create groups** (όχι folder references)

### 4. Τροποποίηση AppDelegate

Αλλάξτε το `ios/DentalPracticeManagement/AppDelegate.mm`:

```objc
// Αντί για:
NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];

// Χρησιμοποιήστε:
NSURL *jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
```

## Προτεινόμενη Λύση: Metro + Xcode

**Για development, είναι καλύτερο να:**
1. Τρέχετε Metro bundler (`npm start`)
2. Build από Xcode (⌘R)

Αυτό επιτρέπει:
- ✅ Hot reload
- ✅ Fast refresh
- ✅ Live debugging
- ✅ Easy updates

## Troubleshooting

### Metro δεν συνδέεται

1. **Ελέγξτε το IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Στο Xcode, Edit Scheme:**
   - **Run** → **Arguments**
   - **Environment Variables:**
     - `OS_ACTIVITY_MODE` = `disable` (optional)

3. **Ελέγξτε firewall:**
   - System Preferences → Security → Firewall
   - Allow Metro/Node connections

### Device δεν βρίσκει Metro

1. **Στο device, Settings:**
   - WiFi → Επιλέξτε ίδιο network με Mac
   
2. **Στο Metro terminal:**
   - Πατήστε `s` για να δείτε QR code
   - Ή copy το URL (exp://192.168.x.x:8081)

3. **Στο Xcode:**
   - Product → Scheme → Edit Scheme
   - Run → Arguments → Environment Variables
   - Προσθέστε: `REACT_NATIVE_PACKAGER_HOSTNAME` = `192.168.x.x` (Mac IP)

## Quick Start

```bash
# Terminal 1: Metro Bundler
npm start

# Xcode: Run (⌘R)
```

Αυτό είναι το πιο απλό και αποτελεσματικό!

