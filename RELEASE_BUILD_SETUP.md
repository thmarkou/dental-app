# Release Build Setup - Χωρίς Metro Bundler

## Το Πρόβλημα

Στο Release mode, το app προσπαθεί να συνδεθεί στο Metro bundler, αλλά:
- Release build δεν χρειάζεται Metro
- Χρειάζεται bundled JavaScript file

## Λύση: Bundle JavaScript

### Βήμα 1: Create Bundle

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
./scripts/bundle-for-release.sh
```

Ή manually:
```bash
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/
```

### Βήμα 2: Προσθήκη Bundle στο Xcode

1. **Open Xcode:**
   ```bash
   open ios/DentalPracticeManagement.xcworkspace
   ```

2. **Right-click** στο project "DentalPracticeManagement" (στο Project Navigator)

3. **Add Files to "DentalPracticeManagement"...**

4. **Navigate** στο `ios/` folder

5. **Select** `main.jsbundle`

6. **Σημαντικό - Επιλέξτε:**
   - ✅ **"Copy items if needed"**
   - ✅ **"Create groups"** (όχι "Create folder references")
   - ✅ **Target: DentalPracticeManagement** (checked)

7. **Click "Add"**

### Βήμα 3: Επαλήθευση

Στο Xcode Project Navigator, θα πρέπει να βλέπετε:
```
DentalPracticeManagement/
  ├── main.jsbundle ✅
  └── ...
```

### Βήμα 4: Build & Run

1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

## ✅ Επαλήθευση

Στο Xcode console, θα πρέπει να δείτε:
```
📦 Initializing database...
✅ Database initialized successfully
```

**ΔΕΝ θα δείτε:**
```
No bundle URL present
Local network prohibited
```

## 🔄 Επαναδημιουργία Bundle

Αν κάνετε αλλαγές στον JavaScript code, πρέπει να επαναδημιουργήσετε το bundle:

```bash
./scripts/bundle-for-release.sh
```

Στη συνέχεια, rebuild στο Xcode.

## 📝 Notes

- **Debug mode:** Χρησιμοποιεί Metro bundler (hot reload)
- **Release mode:** Χρησιμοποιεί bundled JavaScript (standalone)
- Το bundle πρέπει να είναι στο Xcode project
- AppDelegate έχει ήδη fallback για bundled file

## 🎯 Automation

Μπορείτε να προσθέσετε script στο `package.json`:

```json
"scripts": {
  "bundle:ios": "./scripts/bundle-for-release.sh"
}
```

Τότε:
```bash
npm run bundle:ios
```

---

**Τώρα: Προσθέστε το bundle στο Xcode και rebuild!** 🚀

