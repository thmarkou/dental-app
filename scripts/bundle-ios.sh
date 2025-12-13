#!/bin/bash

# Bundle iOS JavaScript for Release builds
# Run this before building Release in Xcode

echo "📦 Creating iOS JavaScript bundle..."

npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/

if [ $? -eq 0 ]; then
  echo "✅ Bundle created successfully!"
  echo "📱 Now build Release in Xcode (⌘B)"
else
  echo "❌ Bundle creation failed!"
  exit 1
fi

