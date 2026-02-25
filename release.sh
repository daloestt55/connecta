#!/bin/bash

# Release script for Connecta
# Usage: ./release.sh <version>
# Example: ./release.sh 1.0.0

if [ -z "$1" ]; then
  echo "Error: Version number required"
  echo "Usage: ./release.sh <version>"
  echo "Example: ./release.sh 1.0.0"
  exit 1
fi

VERSION=$1

echo "🚀 Preparing release v$VERSION..."

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Warning: You have uncommitted changes"
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Release cancelled"
    exit 1
  fi
fi

# Update version in package.json
echo "📝 Updating package.json version to $VERSION..."
npm version $VERSION --no-git-tag-version

# Update CHANGELOG.md date
TODAY=$(date +%Y-%m-%d)
sed -i "s/## \[Unreleased\]/## [$VERSION] - $TODAY/" CHANGELOG.md

# Commit changes
echo "💾 Committing changes..."
git add package.json CHANGELOG.md
git commit -m "Release v$VERSION"

# Create git tag
echo "🏷️  Creating git tag v$VERSION..."
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to remote
echo "📤 Pushing to remote..."
git push origin main
git push origin "v$VERSION"

echo "✅ Release v$VERSION created successfully!"
echo ""
echo "Next steps:"
echo "1. GitHub Actions will automatically build and create a release"
echo "2. Check GitHub Actions: https://github.com/yourusername/connecta/actions"
echo "3. View release: https://github.com/yourusername/connecta/releases/tag/v$VERSION"
