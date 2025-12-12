# Expo Build Guide - Development & Production

## Development με Expo Go

### Quick Start

```bash
# 1. Start Expo development server
npm start
# ή
npx expo start

# 2. Στο iPhone Simulator:
# - Πιέστε 'i' για iOS simulator
# - Ή σκανάρετε QR code με Expo Go app στο real iPhone
```

### Χρήση Expo Go App

1. Κατεβάστε **Expo Go** από App Store στο iPhone σας
2. Τρέξτε `npm start`
3. Σκανάρετε το QR code που εμφανίζεται
4. Η εφαρμογή θα ανοίξει στο Expo Go

## Development Build (Custom Native Code)

Για να χρησιμοποιήσουμε custom native modules (όπως expo-sqlite), χρειάζεται **Development Build**:

### Setup EAS (Expo Application Services)

```bash
# 1. Εγκατάσταση EAS CLI
npm install -g eas-cli

# 2. Login στο Expo account
eas login

# 3. Configure project
eas build:configure
```

### Development Build για iOS

```bash
# Build development client για iOS Simulator
eas build --profile development --platform ios

# Ή για real device
eas build --profile development --platform ios --local
```

### Χρήση Development Build

1. Κατεβάστε το `.ipa` file από EAS
2. Εγκαταστήστε στο iPhone (μέσω Xcode ή TestFlight)
3. Τρέξτε `npm start` και συνδεθείτε με development client

## Production Build για Real iPhone

### Build με EAS (Cloud Build)

```bash
# 1. Configure production build
eas build:configure

# 2. Build για iOS
eas build --profile production --platform ios

# 3. Download .ipa file
# 4. Install via Xcode ή TestFlight
```

### Build Locally με Xcode

```bash
# 1. Generate iOS project
npx expo prebuild --platform ios

# 2. Open in Xcode
open ios/DentalPractice.xcworkspace

# 3. Στο Xcode:
#    - Select your development team
#    - Connect iPhone
#    - Select your device
#    - Click Run (▶️)
```

### Build για App Store

```bash
# 1. Build production
eas build --profile production --platform ios

# 2. Submit to App Store
eas submit --platform ios
```

## Build Profiles (eas.json)

- **development**: Development build με development client
- **preview**: Internal distribution (TestFlight)
- **production**: App Store build

## Σημαντικές Σημειώσεις

1. **Development**: Χρησιμοποιήστε Expo Go για γρήγορη ανάπτυξη
2. **Custom Native Code**: Χρειάζεται Development Build
3. **Production**: Build με EAS ή locally με Xcode
4. **Real Device**: Χρειάζεται Apple Developer account ($99/year)

## Troubleshooting

### Expo Go δεν υποστηρίζει custom native modules

Αν χρησιμοποιείτε `expo-sqlite` ή άλλα custom modules, χρειάζεται Development Build, όχι Expo Go.

### Build fails

- Ελέγξτε ότι έχετε Apple Developer account
- Ελέγξτε certificates στο Xcode
- Ελέγξτε bundle identifier

## Next Steps

1. **Development**: Χρησιμοποιήστε `npm start` με Expo Go ή Development Build
2. **Testing**: Build preview profile για TestFlight
3. **Production**: Build production profile για App Store
