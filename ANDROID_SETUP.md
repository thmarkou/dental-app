# Android Setup Guide

## Prerequisites

- **Android Studio** installed
- **Java Development Kit (JDK)** 17+
- **Android SDK** (via Android Studio)

## Initial Setup

### 1. Install Android Dependencies

```bash
cd /Users/fanis/AIProjects/cursor/dentalapp
npx expo prebuild --platform android
```

### 2. Open in Android Studio

```bash
# Open Android Studio
# File → Open → Select: android/
```

### 3. Sync Gradle

Στο Android Studio:
- **File** → **Sync Project with Gradle Files**

### 4. Build & Run

```bash
# Option 1: Expo
npx expo run:android

# Option 2: Android Studio
# Click Run button (▶️)
```

## Android Configuration

### app.json Configuration

Το `app.json` έχει ήδη Android configuration:
- Package: `com.dentalapp.practice`
- Permissions: Camera, Storage
- Adaptive Icon: Background color configured

### Database

Το `react-native-quick-sqlite` λειτουργεί και σε Android - δεν χρειάζεται επιπλέον setup.

## Build for Production

### Development Build

```bash
npx expo run:android
```

### Production Build (APK)

```bash
# Build APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Production Build (AAB - for Play Store)

```bash
# Build AAB
cd android
./gradlew bundleRelease

# AAB location:
# android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

### Gradle Sync Issues

```bash
cd android
./gradlew clean
./gradlew build
```

### Metro Bundler

Για Debug builds, χρειάζεται Metro bundler:
```bash
npm start
```

---

**Android support is ready!** 🤖

