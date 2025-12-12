#!/bin/bash

# Git Setup Script for Dental Practice Management App
# Usage: ./setup-git.sh <repository-url>

if [ -z "$1" ]; then
    echo "Usage: ./setup-git.sh <repository-url>"
    echo "Example: ./setup-git.sh https://github.com/username/dental-app.git"
    exit 1
fi

REPO_URL=$1

echo "Setting up Git remote repository..."
echo "Repository URL: $REPO_URL"

# Remove existing origin if it exists
git remote remove origin 2>/dev/null

# Add new remote
git remote add origin "$REPO_URL"

# Verify remote
echo ""
echo "Remote repositories:"
git remote -v

echo ""
echo "Current branch:"
git branch

echo ""
echo "Ready to push! Run the following command:"
echo "  git push -u origin main"
echo ""
echo "Or if the remote repository is empty and you need to force push:"
echo "  git push -u origin main --force"
echo ""
echo "Note: Use --force only if you're sure the remote is empty!"

