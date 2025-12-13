# Release Build - Σημαντικές Σημειώσεις

## Release Build Χαρακτηριστικά

### ✅ Τι Λειτουργεί:
- ✅ Optimized code (γρηγορότερο)
- ✅ Μικρότερο app size
- ✅ Κατάλληλο για App Store
- ✅ Production-ready

### ❌ Τι ΔΕΝ Λειτουργεί:
- ❌ **Metro Bundler** (χωρίς hot reload)
- ❌ **Console logs** (χωρίς debugging)
- ❌ **Fast refresh**
- ❌ **Live updates**

## Αν Χρειάζεστε Development

**Αλλάξτε πίσω σε Debug:**

1. **Xcode** → Click στο **Scheme selector** (πάνω αριστερά)
2. **Edit Scheme...**
3. **Run** → **Info** → **Build Configuration**
4. Επιλέξτε **Debug**

## Release Build - Bundle JavaScript

Αν θέλετε να τρέξετε Release build **χωρίς Metro**, πρέπει να bundle το JavaScript:

```bash
# Create JavaScript bundle
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/
```

Στη συνέχεια, το Xcode θα χρησιμοποιήσει το bundled file αντί για Metro.

## Προτεινόμενη Ροή

### Development:
- **Debug** build
- Metro bundler running (`npm start`)
- Hot reload enabled

### Production Testing:
- **Release** build
- Bundled JavaScript
- Production-like environment

### App Store:
- **Release** build
- Archive & Upload
- App Store Connect

## Τρέξιμο Release Build

**Με bundled JavaScript:**
1. Bundle JS: `npx react-native bundle ...` (όπως παραπάνω)
2. Xcode: **Product** → **Build** (⌘B)
3. Run: **Product** → **Run** (⌘R)

**Χωρίς bundle (θα χρειάζεται Metro):**
- Release build **χωρίς** bundle = "No bundle URL" error
- Χρειάζεται Metro bundler ακόμα και σε Release

## Συμπέρασμα

**Για development:** Χρησιμοποιήστε **Debug**
**Για production:** Χρησιμοποιήστε **Release** με bundled JavaScript

