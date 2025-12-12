#!/bin/bash

# Generate secure random secrets for environment variables
# Usage: ./scripts/generate-secrets.sh

echo "Generating secure random secrets..."
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is not installed. Please install it first."
    exit 1
fi

# Generate JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Encryption Key (64 characters)
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

echo ""
echo "Add these values to your .env.dentalapp file:"
echo "  JWT_SECRET=$JWT_SECRET"
echo "  ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "⚠️  Keep these secrets secure and never commit them to Git!"

