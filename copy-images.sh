#!/bin/bash

# Create directories if they don't exist
mkdir -p public/images
mkdir -p public/app_photos

# Copy all images from src/assets/images to public/images
echo "Copying images from src/assets/images to public/images..."
cp -f src/assets/images/*.png public/images/
cp -f src/assets/images/*.jpg public/images/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg public/images/ 2>/dev/null || :
cp -f src/assets/images/*.PNG public/images/ 2>/dev/null || :

# Also copy to root public folder for fallback
echo "Copying images to public root directory for fallback..."
cp -f src/assets/images/*.png public/
cp -f src/assets/images/*.jpg public/ 2>/dev/null || :
cp -f src/assets/images/*.jpeg public/ 2>/dev/null || :
cp -f src/assets/images/*.PNG public/ 2>/dev/null || :

# Set permissions
chmod 644 public/images/*
chmod 644 public/*.png public/*.jpg public/*.jpeg public/*.PNG 2>/dev/null || :

echo "All images copied successfully!"
