#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy all files from public to dist, preserving file attributes
cp -Rp public/* dist/

# Ensure image directories exist
mkdir -p dist/images
mkdir -p dist/icons
mkdir -p dist/app_photos

# Make sure all images have proper permissions
find dist -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" \) -exec chmod 644 {} \;

# Verify the copy was successful
echo "✅ All public files copied to dist folder!"
echo "📁 Image files in dist:"
find dist -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" \) | wc -l
