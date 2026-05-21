#!/bin/bash

# Check if environment file exists and validate required variables
# Usage: ./scripts/check-env.sh

ENV_FILE=".env.dentalapp"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "   Please copy env.dentalapp.example to .env.dentalapp and configure it."
    exit 1
fi

echo "✅ Environment file found: $ENV_FILE"
echo ""

# Source the env file to check variables
# Use a safer method to load env vars
set -a
source "$ENV_FILE" 2>/dev/null || {
    echo "⚠️  Warning: Could not source $ENV_FILE directly"
    echo "   This is normal if the file contains spaces in values"
}
set +a

# Check required variables
REQUIRED_VARS=(
    "APP_NAME"
    "APP_BUNDLE_ID"
    "APP_PACKAGE_NAME"
    "DATABASE_NAME"
    "DATABASE_PATH"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All required variables are set"
else
    echo "⚠️  Missing required variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

# Security (strict check via Node)
if command -v node &> /dev/null; then
    node scripts/validate-env.mjs || exit 1
else
    echo "⚠️  Node not found — run: npm run env:check"
fi

