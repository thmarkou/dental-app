# Dental Practice Management Application

React Native mobile application for managing a small Greek dental practice (2-3 staff members).

## Project Structure

This application runs in an isolated environment to prevent conflicts with other applications in the same directory.

## Environment Setup

### Prerequisites

- Node.js 18+
- React Native CLI
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio, JDK 17+ (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
cp .env.dentalapp.example .env.dentalapp
# Edit .env.dentalapp with your configuration
```

3. For iOS:
```bash
cd ios
pod install
cd ..
```

4. Run the application:
```bash
# iOS
npm run ios
# or
yarn ios

# Android
npm run android
# or
yarn android
```

## Git Setup

### Initial Setup

If you've created a remote repository (e.g., on GitHub, GitLab), connect it to your local repository:

**Option 1: Using the setup script**
```bash
./setup-git.sh <repository-url>
# Example: ./setup-git.sh https://github.com/username/dental-app.git
```

**Option 2: Manual setup**
```bash
# Add remote repository
git remote add origin <repository-url>

# Verify remote
git remote -v

# Push to remote
git push -u origin main
```

**Note**: If the remote repository is empty and you encounter errors, you may need to use:
```bash
git push -u origin main --force
```
⚠️ Use `--force` only if you're sure the remote repository is empty!

### Repository URL Examples

- **GitHub**: `https://github.com/username/dental-app.git` or `git@github.com:username/dental-app.git`
- **GitLab**: `https://gitlab.com/username/dental-app.git`
- **Bitbucket**: `https://bitbucket.org/username/dental-app.git`

## Environment Isolation

This application uses isolated configuration to prevent conflicts with other applications:

- Separate environment file: `.env.dentalapp`
- Isolated database: `dentalapp.db`
- Separate storage paths with `@dentalapp:` prefix
- Unique bundle identifiers

## Documentation

- **Prompt Document**: `dental-practice-prompt.md` - Comprehensive prompt for cursor.ai
- **Specification Document**: `dental-practice-specification.md` - Detailed technical specifications

## Features

- Patient Management
- Appointment Scheduling
- Treatment & Examination Management
- Financial Management (Invoicing, Payments, myDATA integration)
- Inventory Management
- Reporting & Analytics
- Communication (SMS, Email)
- Compliance (GDPR, Greek Dental Association)

## Development

### Code Style

- TypeScript with strict mode
- No 'any' types (unless absolutely necessary with documentation)
- Follow DRY and KISS principles
- Self-documenting code
- Tailwind CSS v4 syntax

### Testing

```bash
npm test
# or
yarn test
```

## License

[Add your license here]

## Contact

[Add contact information here]

