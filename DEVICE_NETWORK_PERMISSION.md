# Device Network Permission - Step by Step

## Το Πρόβλημα

Το app δεν μπορεί να συνδεθεί στο Metro bundler σε **real device**:
```
Error: Local network prohibited
```

## Λύση: Δώστε Permission στο Device

### Βήμα 1: Τρέξτε το App για πρώτη φορά

1. Στο Xcode, τρέξτε το app στο device (⌘R)
2. Το app θα ανοίξει αλλά δεν θα φορτώσει (μαύρη οθόνη)

### Βήμα 2: Δώστε Permission

**Στο iOS Device:**

1. Ανοίξτε **Settings** (Ρυθμίσεις)
2. Πηγαίνετε σε **Privacy & Security** (Απορρήτου & Ασφάλεια)
3. Πηγαίνετε σε **Local Network** (Τοπικό Δίκτυο)
4. Βρείτε **"Dental Practice Management"**
5. **Ενεργοποιήστε το toggle** (ON)

### Βήμα 3: Restart App

1. Στο Xcode, **Stop** το app (⇧⌘.)
2. **Run** ξανά (⌘R)
3. Το app θα συνδεθεί στο Metro bundler!

## Εναλλακτική: Χρησιμοποιήστε Simulator

Αν δεν μπορείτε να δώσετε permission ή θέλετε γρήγορη δοκιμή:

1. Στο Xcode, αλλάξτε το device σε **iPhone Simulator**
2. Simulator **δεν χρειάζεται** network permission
3. Run (⌘R)

Το AppDelegate έχει ήδη fallback για simulator (localhost).

## Ελέγχος

**Μετά το permission:**

1. Metro terminal θα δείξει bundle requests
2. Xcode console: "Loading bundle from http://..."
3. App UI θα εμφανιστεί

## Troubleshooting

### Permission δεν εμφανίζεται

1. **Uninstall** το app από το device
2. **Clean Build Folder** (⇧⌘K)
3. **Rebuild & Run** (⌘R)
4. Το permission prompt θα εμφανιστεί

### Permission δόθηκε αλλά δεν λειτουργεί

1. **Settings** → **Privacy & Security** → **Local Network**
2. Ελέγξτε ότι το toggle είναι **ON**
3. **Restart** το app

### Device και Mac σε διαφορετικό WiFi

- Device και Mac **πρέπει** να είναι στο ίδιο WiFi network
- Ελέγξτε IP addresses:
  ```bash
  # Mac IP
  ifconfig | grep "inet " | grep -v 127.0.0.1
  
  # Device IP (Settings → WiFi → Network name → IP Address)
  ```

## Quick Checklist

- [ ] App τρέχει στο device
- [ ] Settings → Privacy & Security → Local Network
- [ ] "Dental Practice Management" toggle = ON
- [ ] Device και Mac στο ίδιο WiFi
- [ ] Restart app
- [ ] Metro bundler τρέχει

## Success!

Όταν λειτουργεί, θα δείτε:
- ✅ Metro terminal: Bundle requests
- ✅ Xcode console: "Loading bundle from..."
- ✅ App UI: Login screen ή Dashboard

