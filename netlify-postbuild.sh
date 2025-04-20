#!/bin/bash

echo "=== NETLIFY POST-BUILD FAVICON FIX ==="

# Ensure all favicon files are in the dist root
echo "Copying favicon files to dist root..."
cp -f public/favicon*.* dist/
cp -f public/apple-touch-icon.png dist/
cp -f public/manifest.webmanifest dist/

# Verify the copy was successful
echo "✅ Favicon files copied to dist folder!"
find dist -maxdepth 1 -name "favicon*" -o -name "apple-touch-icon.png" -o -name "manifest.webmanifest" | sort

echo "=== NETLIFY POST-BUILD FAVICON FIX COMPLETE ==="
