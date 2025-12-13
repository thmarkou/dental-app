#!/bin/bash

# Bundle JavaScript for iOS Release build
# This script creates the main.jsbundle file needed for Release builds without Metro

set -e

echo "📦 Bundling JavaScript for iOS Release build..."

cd "$(dirname "$0")/.."

# Create bundle
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/

echo "✅ Bundle created: ios/main.jsbundle"
echo ""
echo "📝 Next steps:"
echo "1. Open Xcode: open ios/DentalPracticeManagement.xcworkspace"
echo "2. Right-click on project → Add Files to 'DentalPracticeManagement'..."
echo "3. Select ios/main.jsbundle"
echo "4. ✅ Check 'Copy items if needed'"
echo "5. ✅ Check 'Create groups'"
echo "6. Build & Run in Release mode"

