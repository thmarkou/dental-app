# Dental Practice Management Application

React Native mobile application for managing a small Greek dental practice (2-3 staff members).

## Project Structure

This application runs in an isolated environment to prevent conflicts with other applications in the same directory.

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **Database**: Expo SQLite (offline-first)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Styling**: StyleSheet (will add Tailwind CSS v4 later)

## Environment Setup

### Prerequisites

- Node.js 20+ (use `nvm use` to activate)
- Expo CLI (optional, for development)
- iOS: Xcode 14+ (for iOS development/build)
- Android: Android Studio (for Android development)

### Quick Start

1. **Activate Node.js environment**:

   ```bash
   nvm use
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start development server**:

   ```bash
   npm start
   # Press 'i' for iOS simulator
   # Or scan QR code with Expo Go app on your iPhone
   ```

4. **For Development Build** (if using custom native modules):

   ```bash
   # Install EAS CLI
   npm install -g eas-cli

   # Login
   eas login

   # Build development client
   eas build --profile development --platform ios
   ```

## Environment Configuration

### Environment Files

- **`.env.dentalapp`**: Main environment configuration file (not committed to Git)
- **`env.dentalapp.example`**: Example template with all available variables
- **`config/env.config.ts`**: TypeScript configuration loader

### Environment Setup

1. **Initial Setup**:

   ```bash
   npm run env:setup
   npm run env:check
   ```

2. **Production / EAS** (required before release):
   ```bash
   npm run env:check:prod
   ```
   See [docs/PRODUCTION_ENV.md](./docs/PRODUCTION_ENV.md).

## Running the App

### Development (Expo Go)

```bash
npm start
# Then press 'i' for iOS simulator
# Or scan QR code with Expo Go app
```

### Development Build (Custom Native Code)

```bash
# Build development client first
eas build --profile development --platform ios

# Then run
npm start
# Connect to development client (not Expo Go)
```

### Production Build

See `EXPO_BUILD_GUIDE.md` for detailed instructions.

## Project Structure

```
dentalapp/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/          # Screen components
│   ├── services/         # Business logic services
│   │   ├── auth/        # Authentication service
│   │   ├── patient/     # Patient service
│   │   └── database/   # Database service
│   ├── navigation/      # Navigation setup
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── config/              # Configuration files
├── assets/              # Images, icons, etc.
├── scripts/             # Helper scripts
└── app.json            # Expo configuration
```

## Features

- ✅ Patient Management
- ✅ Appointment Scheduling
- ✅ Treatment & Examination Management
- ✅ Financial Management (Invoicing, Payments, myDATA integration)
- ✅ Inventory Management
- ✅ Reporting & Analytics
- ✅ Communication (SMS, Email)
- ✅ Compliance (GDPR, Greek Dental Association)

## Development

### Code Style

- TypeScript with strict mode
- No 'any' types (unless absolutely necessary with documentation)
- Follow DRY and KISS principles
- Self-documenting code
- Tailwind CSS v4 syntax (when added)

### Testing

```bash
npm test          # τοπικά (Jest, Node environment)
npm run test:ci   # όπως στο GitHub Actions
npm run type-check
```

**CI (GitHub Actions):** σε κάθε push/PR στο `main` τρέχουν `type-check`, `env:check` (από template), και `npm test`. Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Building for Production

### iOS (Real iPhone)

1. **Using EAS (Recommended)**:

   ```bash
   eas build --profile production --platform ios
   ```

2. **Using Xcode**:
   ```bash
   npx expo prebuild --platform ios
   open ios/DentalPractice.xcworkspace
   # Then build in Xcode
   ```

See `EXPO_BUILD_GUIDE.md` for detailed build instructions.

## Documentation

- **Manual test checklist**: [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) — χειροκίνητες δοκιμές πριν demo/release
- **Progress summary**: [PROGRESS_SUMMARY.md](./PROGRESS_SUMMARY.md) — ιστορικό features
- **Latest session**: [SESSION_2026-05-21.md](./SESSION_2026-05-21.md)
- **Reload / migrations**: [RELOAD_INSTRUCTIONS.md](./RELOAD_INSTRUCTIONS.md)
- **Backlog**: [BACKLOG_CLINICAL.md](./BACKLOG_CLINICAL.md) · [BACKLOG_APPOINTMENTS.md](./BACKLOG_APPOINTMENTS.md)
- **Πλάνο υλοποίησης (εκκρεμότητες):** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Prompt Document**: `dental-practice-prompt-merged.md` - Complete prompt for cursor.ai
- **Specification Document**: `dental-practice-specification.md` - Detailed technical specifications
- **Build Guide**: `EXPO_BUILD_GUIDE.md` - Expo build instructions
- **Database Guide**: `DATABASE.md` - Database architecture

## License

[Add your license here]

## Contact

[Add contact information here]
