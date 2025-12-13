# Ελέγχος Bundle στο Xcode - Απλές Οδηγίες

## Μέθοδος 1: Build Phases (Πιο Απλή)

### Βήμα 1: Open Build Phases

1. **Στο Xcode**, κάντε click στο **project "DentalPracticeManagement"** (μπλε icon, αριστερό sidebar)
2. **Select** το **Target "DentalPracticeManagement"** (κάτω από TARGETS)
3. **Click** στο tab **"Build Phases"** (πάνω)

### Βήμα 2: Ελέγξτε Copy Bundle Resources

1. **Βρείτε** το section **"Copy Bundle Resources"**
2. **Click** το **arrow** για να το expand
3. **Ψάξτε** για `main.jsbundle` ή `main 2.jsbundle`

### Βήμα 3: Αν ΔΕΝ Υπάρχει

1. **Click** το **"+"** button (κάτω από Copy Bundle Resources)
2. **Select** το `main.jsbundle` ή `main 2.jsbundle` από το `ios/` folder
3. **Click "Add"**

### Βήμα 4: Clean & Rebuild

1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

## Μέθοδος 2: Project Navigator

### Βήμα 1: Βρείτε το Bundle

1. **Στο Project Navigator** (αριστερό sidebar)
2. **Ψάξτε** για `main.jsbundle` ή `main 2.jsbundle`
3. **Click** πάνω του (για να το select)

### Βήμα 2: File Inspector

1. **View** → **Inspectors** → **File Inspector** (ή πιέστε ⌥⌘1)
2. **Στο δεξιά sidebar**, θα δείτε:
   - **Target Membership:** Βεβαιωθείτε ότι **DentalPracticeManagement** είναι **checked** ✅
   - **Location:** Θα πρέπει να λέει "Relative to Group"

### Βήμα 3: Αν Target Membership ΔΕΝ είναι Checked

1. **Check** το box **DentalPracticeManagement**
2. **Clean & Rebuild**

## Quick Check

**Αν το bundle είναι στο Copy Bundle Resources, θα λειτουργήσει!**

---

**Πηγαίνετε στο Build Phases → Copy Bundle Resources και προσθέστε το bundle αν λείπει!** ✅

