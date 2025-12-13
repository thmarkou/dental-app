# Προσθήκη main.jsbundle στο Xcode - Step by Step

## Βήματα

### 1. Open Xcode

```bash
open ios/DentalPracticeManagement.xcworkspace
```

### 2. Προσθήκη Bundle

1. **Right-click** στο project "DentalPracticeManagement" (στο Project Navigator, αριστερό sidebar)

2. **Add Files to "DentalPracticeManagement"...**

3. **Navigate** στο `ios/` folder

4. **Select** `main.jsbundle`

5. **Στο dialog που ανοίγει, επιλέξτε:**
   - ✅ **"Copy files to destination"** (όχι "Reference files in place")
   - ✅ **Target: DentalPracticeManagement** (checked - αυτό είναι το σημαντικό!)

6. **Click "Add"**

### 3. Επαλήθευση

Στο Xcode Project Navigator, θα πρέπει να βλέπετε:
```
DentalPracticeManagement/
  ├── main.jsbundle ✅
  └── ...
```

### 4. Build & Run

1. **Product** → **Clean Build Folder** (⇧⌘K)
2. **Product** → **Build** (⌘B)
3. **Product** → **Run** (⌘R)

## Σημαντικό

- **"Copy files to destination"** = Το bundle θα αντιγραφεί στο Xcode project
- **"Reference files in place"** = Μόνο reference (ΔΕΝ λειτουργεί για Release builds)
- **Target: DentalPracticeManagement** = Το bundle θα συμπεριληφθεί στο build (ΑΥΤΟ ΕΙΝΑΙ ΚΡΙΣΙΜΟ!)

## Επαλήθευση

Μετά το rebuild, στο Xcode console:
```
📦 Initializing database...
✅ Database initialized successfully
```

**ΔΕΝ θα δείτε:**
```
No bundle URL present
```

---

**Προσθέστε το bundle με "Copy files to destination"!** ✅

