# Quick Start Guide - iOS Simulator

## Τρέχον Status

✅ Dependencies installed  
⚠️ iOS project structure needs to be created

## Γρήγορη Λύση

Για να δείτε την εφαρμογή στο iOS Simulator, χρειάζεται να δημιουργήσουμε το iOS project.

### Βήμα 1: Δημιουργία iOS Project

```bash
# Μεταβείτε στο parent directory
cd ..

# Δημιουργήστε ένα temporary React Native project
npx react-native init DentalPracticeTemp --skip-install

# Αντιγράψτε τα iOS files
cp -r DentalPracticeTemp/ios dentalapp/
cp -r DentalPracticeTemp/android dentalapp/

# Διαγράψτε το temp project
rm -rf DentalPracticeTemp

# Επιστρέψτε στο project
cd dentalapp
```

### Βήμα 2: Εγκατάσταση iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### Βήμα 3: Τρέξτε στο Simulator

```bash
npx react-native run-ios
```

## Εναλλακτική: Χρησιμοποιήστε Expo

Αν θέλετε να δείτε την εφαρμογή πιο γρήγορα, μπορούμε να μετατρέψουμε το project σε Expo:

```bash
npx expo install expo
npx expo start
```

Μετά ανοίξτε το Expo Go app στο iPhone σας ή simulator.

## Προσωρινή Λύση

Μέχρι να δημιουργήσουμε το iOS project, μπορείτε να:

1. Δείτε τον κώδικα στο editor
2. Ελέγξτε τα TypeScript types
3. Test τα services

---

**Σημείωση**: Το iOS project structure είναι πολύπλοκο και χρειάζεται Xcode project files. Η καλύτερη λύση είναι να δημιουργήσουμε ένα fresh React Native project και να αντιγράψουμε τον κώδικα μας εκεί, ή να χρησιμοποιήσουμε Expo.

