# App Icon Setup

## Πού να Ανέβετε το Icon

### Option 1: Assets Folder (Προτεινόμενη)

Ανέβετε το icon στο:
```
assets/icon.png
```

**Απαιτήσεις:**
- Μέγεθος: **1024x1024 pixels**
- Format: **PNG**
- Background: **Transparent ή solid color**
- Square: **1:1 aspect ratio**

### Option 2: iOS Assets (Xcode)

Αν θέλετε να το προσθέσετε απευθείας στο Xcode:
```
ios/DentalPracticeManagement/Images.xcassets/AppIcon.appiconset/
```

## Android Adaptive Icon

Για Android, χρειάζεστε:
- **Foreground:** `assets/adaptive-icon.png` (1024x1024)
- **Background:** Color ή image (optional)

## Μετά την Ανέβαση

1. **Update app.json:**
   ```json
   {
     "expo": {
       "icon": "./assets/icon.png",
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#ffffff"
         }
       }
     }
   }
   ```

2. **Rebuild:**
   ```bash
   npx expo prebuild --clean
   ```

---

**Ανέβετε το icon στο `assets/icon.png` (1024x1024 PNG)** 📱

