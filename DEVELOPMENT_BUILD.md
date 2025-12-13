# Development Build Guide

## What is a Development Build?

A development build is a custom version of your app that includes native code and custom native modules (like `expo-sqlite`). Unlike Expo Go, it allows you to use all native features.

## Prerequisites

- **Xcode** installed (for iOS)
- **CocoaPods** installed: `sudo gem install cocoapods`
- **Node.js** v20 (via nvm: `nvm use`)

## Building for iOS

### First Time Setup

1. **Install iOS dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Build and run:**
   ```bash
   npx expo run:ios
   ```

   This will:
   - Build the native iOS app
   - Install it on the simulator
   - Start Metro bundler
   - Launch the app

### Subsequent Builds

After the first build, you can:
- Run directly: `npx expo run:ios`
- Or open in Xcode: `open ios/DentalPracticeManagement.xcworkspace`

## Building for Android

```bash
npx expo run:android
```

## Troubleshooting

### Pod Install Issues

If you get CocoaPods errors:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Xcode Build Errors

1. Open Xcode: `open ios/DentalPracticeManagement.xcworkspace`
2. Select a simulator in Xcode
3. Click Run (⌘R)

### Metro Bundler Issues

If Metro doesn't start:
```bash
npm start -- --clear
```

## What Works in Development Build

✅ **Full database functionality** (expo-sqlite)
✅ **All native modules**
✅ **File system access**
✅ **Camera and photo library**
✅ **Push notifications**
✅ **All Expo features**

## Development vs Production

- **Development Build**: For testing with full features
- **Production Build**: Use EAS Build for App Store/Play Store

For production builds, see `EXPO_BUILD_GUIDE.md`.

