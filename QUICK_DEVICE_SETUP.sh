#!/bin/bash

# Quick Setup Script for Real Device
# Run this to prepare for device deployment

echo "🔧 Setting up for real device deployment..."

# Check if device is connected
echo "📱 Checking for connected devices..."
xcrun xctrace list devices 2>&1 | grep -i "iphone\|ipad" || echo "⚠️  No devices found. Connect your device via USB."

# Open Xcode workspace
echo "📂 Opening Xcode workspace..."
open ios/DentalPracticeManagement.xcworkspace

echo ""
echo "✅ Next steps:"
echo "1. In Xcode, select your device from the device dropdown"
echo "2. Go to Signing & Capabilities tab"
echo "3. Select your Team (or add Apple ID)"
echo "4. Click Run (⌘R)"
echo ""
echo "📖 For detailed instructions, see RUN_ON_REAL_DEVICE.md"

