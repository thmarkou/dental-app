# Dental Practice Management Application

React Native mobile application for managing a small Greek dental practice (2-3 staff members).

## Project Structure

This application runs in an isolated environment to prevent conflicts with other applications in the same directory.

## Environment Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- nvm (Node Version Manager) - for managing Node.js versions
- React Native CLI
- iOS: Xcode 14+ (for iOS development)
- Android: Android Studio, JDK 17+ (for Android development)

### Quick Start

1. **Activate Node.js environment** (using nvm):
   ```bash
   nvm use
   ```
   This will automatically use the Node.js version specified in `.nvmrc` (Node.js 20).

2. **Verify Node.js version**:
   ```bash
   node --version
   # Should show: v20.x.x
   ```

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
# Copy the example file
cp env.dentalapp.example .env.dentalapp

# Edit .env.dentalapp with your configuration
# The file is already created with default development values

# Check environment configuration
./scripts/check-env.sh

# Generate secure secrets (recommended for production)
./scripts/generate-secrets.sh
```

**Important**: The `.env.dentalapp` file contains sensitive information and is automatically ignored by Git. Never commit it to the repository.

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

## Environment Configuration

### Environment Files

- **`.env.dentalapp`**: Main environment configuration file (not committed to Git)
- **`env.dentalapp.example`**: Example template with all available variables
- **`config/env.config.ts`**: TypeScript configuration loader

### Environment Setup

1. **Initial Setup**:
   ```bash
   # The .env.dentalapp file is already created with defaults
   # Check if it's configured correctly
   ./scripts/check-env.sh
   ```

2. **Generate Secure Secrets** (for production):
   ```bash
   ./scripts/generate-secrets.sh
   # Copy the generated secrets to .env.dentalapp
   ```

3. **Configure Services** (when ready):
   - SMS Gateway: Add `SMS_GATEWAY_API_KEY` and related settings
   - Email Service: Add `EMAIL_SMTP_*` settings
   - myDATA API: Add `MYDATA_*` settings for Greek tax integration

### Environment Variables

Key variables to configure:

- **App Configuration**: `APP_NAME`, `APP_BUNDLE_ID`, `APP_PACKAGE_NAME`
- **Database**: `DATABASE_NAME`, `DATABASE_PATH`
- **Security**: `JWT_SECRET`, `ENCRYPTION_KEY` (generate secure values!)
- **Feature Flags**: Enable/disable features like SMS, Email, myDATA
- **Storage Paths**: Configure where data is stored

### Node.js Version Management (nvm)

This project uses **nvm** (Node Version Manager) to ensure consistent Node.js versions across different environments.

**Quick Setup**:
```bash
# Activate the correct Node.js version (automatically reads .nvmrc)
nvm use

# Or use the complete setup script
./scripts/setup-env.sh
```

The `.nvmrc` file specifies Node.js 20 (LTS), which is compatible with React Native.

**Manual Setup**:
```bash
# Install Node.js 20 if not already installed
nvm install 20

# Use Node.js 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x
```

### Helper Scripts

- **`scripts/setup-env.sh`**: Complete environment setup (nvm, env files, validation)
- **`scripts/check-env.sh`**: Validates environment configuration
- **`scripts/generate-secrets.sh`**: Generates secure random secrets

## Environment Isolation

This application uses isolated configuration to prevent conflicts with other applications:

- Separate environment file: `.env.dentalapp`
- Isolated database: `dentalapp.db` in `./data/` directory
- Separate storage paths: `./storage/dentalapp`, `./uploads/dentalapp`, `./cache/dentalapp`
- Unique bundle identifiers: `com.dentalapp.practice`

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

