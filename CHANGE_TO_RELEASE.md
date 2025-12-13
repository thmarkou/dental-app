# Αλλαγή σε Release Mode - Step by Step

## Το Πρόβλημα

Το app είναι σε **Debug mode** και προσπαθεί να συνδεθεί στο Metro bundler, αλλά δεν το βρίσκει.

## Λύση: Αλλάξτε σε Release Mode

### Βήμα 1: Edit Scheme

1. **Στο Xcode**, κάντε click στο **Scheme selector** (πάνω αριστερά, δίπλα στο device selector)
   - Θα δείτε: "DentalPracticeManagement" > "iPhone" (ή device name)

2. **Click** στο scheme name → **Edit Scheme...**

### Βήμα 2: Change Build Configuration

1. **Στο αριστερό menu**, επιλέξτε **"Run"**

2. **Στο tab "Info"**, βρείτε **"Build Configuration"**

3. **Επιλέξτε "Release"** (από το dropdown)

4. **Click "Close"**

### Βήμα 3: Clean & Rebuild

1. **Product** → **Clean Build Folder** (⇧⌘K)

2. **Product** → **Build** (⌘B)

3. **Product** → **Run** (⌘R)

## Επαλήθευση

Μετά το rebuild, στο Xcode console θα πρέπει να δείτε:
```
📦 Initializing database...
✅ Database initialized successfully
```

**ΔΕΝ θα δείτε:**
```
No bundle URL present
Local network prohibited
```

## Σημείωση

- **Release mode** = Χρησιμοποιεί bundled JavaScript (`main 2.jsbundle`)
- **ΔΕΝ χρειάζεται Metro bundler**
- **ΔΕΝ χρειάζεται network permission**

---

**Αλλάξτε σε Release mode και rebuild!** ✅

