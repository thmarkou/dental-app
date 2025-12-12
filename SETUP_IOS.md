# iOS Setup Instructions

Για να τρέξει η εφαρμογή στο iOS Simulator, χρειάζεται να δημιουργήσουμε το iOS project.

## Επιλογές:

### Επιλογή 1: Χρησιμοποιήστε Expo (Προτείνεται για γρήγορη ανάπτυξη)

```bash
# Εγκατάσταση Expo
npm install -g expo-cli

# Μετατροπή σε Expo project
npx expo install expo
```

### Επιλογή 2: React Native CLI (Full Native)

Χρειάζεται να δημιουργήσουμε το iOS project manually ή να χρησιμοποιήσουμε:

```bash
# Δημιουργία νέου React Native project σε temp directory
npx react-native init DentalPracticeTemp

# Αντιγραφή iOS folder
cp -r DentalPracticeTemp/ios .
cp -r DentalPracticeTemp/android .

# Διαγραφή temp
rm -rf DentalPracticeTemp

# Εγκατάσταση pods
cd ios
pod install
cd ..
```

### Επιλογή 3: Χρησιμοποιήστε Expo Go App

Για γρήγορη ανάπτυξη, μπορούμε να χρησιμοποιήσουμε Expo Go που επιτρέπει να δείτε την εφαρμογή αμέσως.

## Τρέχον Status

- ✅ Dependencies installed
- ⚠️ iOS project structure missing
- ⚠️ Android project structure missing

## Προτείνεται

Για να δείτε την εφαρμογή γρήγορα, προτείνω να χρησιμοποιήσουμε **Expo** που είναι πιο απλό για development.

