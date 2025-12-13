# Fix Bundle στο Xcode - main 2.jsbundle

## Το Πρόβλημα

Το Xcode δημιούργησε `main 2.jsbundle` αντί να χρησιμοποιήσει το `main.jsbundle` που υπάρχει στο `ios/` folder.

## Λύση

### Βήμα 1: Διαγραφή main 2.jsbundle

Στο Xcode:
1. **Right-click** στο `main 2.jsbundle` (στο Project Navigator)
2. **Delete**
3. Επιλέξτε **"Move to Trash"** (όχι "Remove Reference")

### Βήμα 2: Προσθήκη main.jsbundle Σωστά

1. **Right-click** στο project "DentalPracticeManagement"
2. **Add Files to "DentalPracticeManagement"...**
3. **Navigate** στο `ios/` folder
4. **Select** `main.jsbundle` (το αρχικό, όχι το "main 2")
5. **Στο dialog:**
   - ✅ **"Copy files to destination"**
   - ✅ **Target: DentalPracticeManagement** (checked)
6. **Click "Add"**

### Βήμα 3: Επαλήθευση

Στο Xcode Project Navigator, θα πρέπει να βλέπετε:
```
DentalPracticeManagement/
  ├── main.jsbundle ✅ (μόνο αυτό, όχι "main 2")
  └── ...
```

### Βήμα 4: Clean & Rebuild

1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

## Αν το main.jsbundle Δεν Εμφανίζεται

Αν δεν βλέπετε το `main.jsbundle` στο `ios/` folder:

1. **Recreate bundle:**
   ```bash
   cd /Users/fanis/AIProjects/cursor/dentalapp
   ./scripts/bundle-for-release.sh
   ```

2. **Επαναλάβετε** τα βήματα 2-4

---

**Διαγράψτε το "main 2.jsbundle" και προσθέστε το σωστό "main.jsbundle"!** ✅

