# Debug vs Release Mode - Οδηγίες

## Το Πρόβλημα

Το app είναι σε **Debug mode** αλλά προσπαθεί να συνδεθεί στο Metro bundler και δεν το βρίσκει.

## Λύσεις

### Option 1: Debug Mode με Metro Bundler (Προτεινόμενη)

**Αν θέλετε Debug mode:**

1. **Start Metro Bundler:**
   ```bash
   cd /Users/fanis/AIProjects/cursor/dentalapp
   npm start
   ```

2. **Στο Xcode:**
   - **Edit Scheme** → **Run** → **Build Configuration** → **Debug** (βεβαιωθείτε ότι είναι Debug)
   - **Product** → **Run** (⌘R)

3. **Στο Device (αν real device):**
   - **Settings** → **Privacy & Security** → **Local Network**
   - Ενεργοποιήστε το toggle για "Dental Practice Management"

### Option 2: Release Mode με Bundle (Χωρίς Metro)

**Αν θέλετε Release mode:**

1. **Στο Xcode:**
   - **Edit Scheme** → **Run** → **Build Configuration** → **Release**
   - **Product** → **Clean Build Folder** (⇧⌘K)
   - **Product** → **Build** (⌘B)
   - **Product** → **Run** (⌘R)

2. **ΔΕΝ χρειάζεται Metro bundler** - χρησιμοποιεί το bundled JavaScript

## Ελέγχος Mode

**Στο Xcode:**
- **Edit Scheme** → **Run** → **Info** → **Build Configuration**
- **Debug** = Metro bundler
- **Release** = Bundled JavaScript

## AppDelegate Configuration

- **Debug mode:** Χρησιμοποιεί Metro bundler (localhost για simulator, network IP για device)
- **Release mode:** Χρησιμοποιεί bundled JavaScript (`main 2.jsbundle`)

---

**Επιλέξτε: Debug με Metro Ή Release με Bundle!** ✅

