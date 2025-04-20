#!/bin/bash

# Create necessary directories
mkdir -p public/images
mkdir -p public/app_photos
mkdir -p dist/images
mkdir -p dist/app_photos

echo "=== Fixing image paths and copying all images ==="

# Copy all images from src/assets/images to public and dist
echo "Copying images from src/assets/images to public and dist..."
cp -f src/assets/images/*.png public/ 2>/dev/null || :
cp -f src/assets/images/*.PNG public/ 2>/dev/null || :
cp -f src/assets/images/*.jpg public/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg public/ 2>/dev/null || :

cp -f src/assets/images/*.png public/images/ 2>/dev/null || :
cp -f src/assets/images/*.PNG public/images/ 2>/dev/null || :
cp -f src/assets/images/*.jpg public/images/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg public/images/ 2>/dev/null || :

cp -f src/assets/images/*.png dist/ 2>/dev/null || :
cp -f src/assets/images/*.PNG dist/ 2>/dev/null || :
cp -f src/assets/images/*.jpg dist/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg dist/ 2>/dev/null || :

cp -f src/assets/images/*.png dist/images/ 2>/dev/null || :
cp -f src/assets/images/*.PNG dist/images/ 2>/dev/null || :
cp -f src/assets/images/*.jpg dist/images/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg dist/images/ 2>/dev/null || :

# Set proper permissions
echo "Setting proper permissions..."
find public -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" -exec chmod 644 {} \;
find dist -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" -exec chmod 644 {} \;

echo "=== Image count in directories ==="
echo "public/: $(find public -maxdepth 1 -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" | wc -l)"
echo "public/images/: $(find public/images -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" | wc -l)"
echo "dist/: $(find dist -maxdepth 1 -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" | wc -l)"
echo "dist/images/: $(find dist/images -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.PNG" | wc -l)"

echo "=== All images fixed and copied successfully! ==="
