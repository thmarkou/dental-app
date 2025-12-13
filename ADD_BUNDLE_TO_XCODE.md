# Προσθήκη main.jsbundle στο Xcode

## Βήματα

### 1. Προσθήκη Bundle στο Xcode

1. **Ανοίξτε το Xcode** (`ios/DentalPracticeManagement.xcworkspace`)

2. **Right-click** στο project "DentalPracticeManagement" (στο Project Navigator, αριστερό sidebar)

3. Επιλέξτε **"Add Files to 'DentalPracticeManagement'..."**

4. **Πηγαίνετε στο folder:** `ios/`

5. **Επιλέξτε το file:** `main.jsbundle`

6. **Σημαντικό - Επιλέξτε:**
   - ✅ **"Copy items if needed"** (αν δεν είναι ήδη στο ios folder)
   - ✅ **"Create groups"** (όχι "Create folder references")
   - ✅ **Target: DentalPracticeManagement** (checked)

7. Κάντε click **"Add"**

### 2. Επαλήθευση

1. Στο Project Navigator, θα πρέπει να βλέπετε το `main.jsbundle` στο project
2. Επιλέξτε το file
3. Στο File Inspector (δεξιά sidebar), ελέγξτε:
   - **Target Membership:** ✅ DentalPracticeManagement (checked)

### 3. Build & Run

1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

Το Release build θα χρησιμοποιήσει το bundled JavaScript!

## Επαναδημιουργία Bundle

Αν κάνετε αλλαγές στον JavaScript code, πρέπει να επαναδημιουργήσετε το bundle:

```bash
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/
```

Στη συνέχεια, rebuild στο Xcode.

## Automation Script

Μπορείτε να δημιουργήσετε script για αυτόματη bundle creation:

```bash
# bundle-ios.sh
#!/bin/bash
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/
echo "✅ Bundle created! Now build in Xcode."
```

