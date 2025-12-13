# Xcode Build Configuration - Debug vs Release

## Πού να αλλάξετε Debug/Release

### Μέθοδος 1: Edit Scheme (Προτεινόμενη)

1. **Στο Xcode**, κάντε click στο **Scheme selector** (δίπλα στο device selector, πάνω αριστερά)
2. Επιλέξτε **"Edit Scheme..."**
3. Στο αριστερό menu, επιλέξτε **"Run"**
4. Στο tab **"Info"**, βρείτε **"Build Configuration"**
5. Επιλέξτε:
   - **Debug** (για development)
   - **Release** (για production build)

### Μέθοδος 2: Product Menu

1. **Product** → **Scheme** → **Edit Scheme...**
2. Ακολουθήστε τα ίδια βήματα όπως παραπάνω

### Μέθοδος 3: Build Settings (Για όλο το project)

1. Επιλέξτε το **project** στο Project Navigator (αριστερό sidebar)
2. Επιλέξτε το **target** "DentalPracticeManagement"
3. Πηγαίνετε στο tab **"Build Settings"**
4. Αναζητήστε **"Configuration"**
5. Μπορείτε να δείτε/επεξεργαστείτε:
   - **Debug** configuration
   - **Release** configuration

## Debug vs Release - Διαφορές

### Debug Build
- ✅ Συμπεριλαμβάνει debug symbols
- ✅ Fast refresh / Hot reload
- ✅ Console logging
- ✅ Metro bundler connection
- ❌ Μεγαλύτερο μέγεθος
- ❌ Πιο αργό

### Release Build
- ✅ Optimized code
- ✅ Μικρότερο μέγεθος
- ✅ Γρηγορότερο
- ✅ Κατάλληλο για App Store
- ❌ Χωρίς debug symbols
- ❌ Χωρίς Metro bundler

## Για Development

**Χρησιμοποιήστε Debug:**
- Γρήγορη ανάπτυξη
- Hot reload
- Easy debugging

## Για Production

**Χρησιμοποιήστε Release:**
- App Store submission
- TestFlight
- Production testing

## Quick Switch

**Στο Scheme selector:**
- Κάντε click στο scheme name (δίπλα στο device)
- **Edit Scheme...**
- **Run** → **Info** → **Build Configuration**

## Command Line

```bash
# Debug build
xcodebuild -workspace ios/DentalPracticeManagement.xcworkspace \
  -scheme DentalPracticeManagement \
  -configuration Debug

# Release build
xcodebuild -workspace ios/DentalPracticeManagement.xcworkspace \
  -scheme DentalPracticeManagement \
  -configuration Release
```

## Σημαντικό

**Για development, χρησιμοποιήστε πάντα Debug:**
- Metro bundler λειτουργεί μόνο με Debug
- Hot reload λειτουργεί μόνο με Debug
- Console logs είναι διαθέσιμα μόνο με Debug

**Για App Store, χρησιμοποιήστε Release:**
- Optimized για production
- Μικρότερο app size
- Καλύτερη απόδοση

