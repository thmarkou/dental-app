#!/bin/bash

# Complete environment setup script for Dental Practice Management App
# This script sets up the Node.js environment and checks configuration

echo "🏥 Dental Practice Management App - Environment Setup"
echo "=================================================="
echo ""

# Check if nvm is installed
if ! command -v nvm &> /dev/null; then
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        # Load nvm if it exists but isn't in PATH
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        echo "❌ Error: nvm (Node Version Manager) is not installed."
        echo "   Please install nvm first: https://github.com/nvm-sh/nvm"
        exit 1
    fi
fi

# Check if .nvmrc exists
if [ ! -f ".nvmrc" ]; then
    echo "⚠️  Warning: .nvmrc file not found"
    echo "   Creating .nvmrc with Node.js 20..."
    echo "20" > .nvmrc
fi

# Read Node version from .nvmrc
NODE_VERSION=$(cat .nvmrc | tr -d '[:space:]')
echo "📦 Node.js version specified: $NODE_VERSION"

# Check if the version is installed
if ! nvm list | grep -q "$NODE_VERSION"; then
    echo "⚠️  Node.js $NODE_VERSION is not installed"
    echo "   Installing Node.js $NODE_VERSION..."
    nvm install "$NODE_VERSION"
fi

# Use the Node.js version
echo "🔄 Activating Node.js $NODE_VERSION..."
nvm use

# Verify Node.js version
CURRENT_NODE=$(node --version)
echo "✅ Current Node.js version: $CURRENT_NODE"
echo ""

# Check npm version
CURRENT_NPM=$(npm --version)
echo "📦 Current npm version: $CURRENT_NPM"
echo ""

# Check environment file
if [ ! -f ".env.dentalapp" ]; then
    echo "⚠️  .env.dentalapp not found"
    echo "   Creating from example..."
    if [ -f "env.dentalapp.example" ]; then
        cp env.dentalapp.example .env.dentalapp
        echo "✅ Created .env.dentalapp from example"
    else
        echo "❌ Error: env.dentalapp.example not found"
        exit 1
    fi
else
    echo "✅ Environment file (.env.dentalapp) found"
fi

# Check environment configuration
echo ""
echo "🔍 Checking environment configuration..."
if [ -f "scripts/check-env.sh" ]; then
    ./scripts/check-env.sh
else
    echo "⚠️  check-env.sh script not found"
fi

echo ""
echo "✨ Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and configure .env.dentalapp if needed"
echo "  2. Run: npm install (or yarn install)"
echo "  3. For iOS: cd ios && pod install && cd .."
echo "  4. Run: npm start (or yarn start)"

