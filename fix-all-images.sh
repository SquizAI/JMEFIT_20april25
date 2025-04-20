#!/bin/bash

# Create necessary directories
mkdir -p public/images
mkdir -p public/icons
mkdir -p dist/images
mkdir -p dist/icons

echo "=== COMPREHENSIVE IMAGE FIX SCRIPT ==="

# Copy all images from src/assets/images to public and dist
echo "Copying images from src/assets to public..."

# Find all image files in src directory recursively
find src/assets -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | while read file; do
    # Get just the filename
    filename=$(basename "$file")
    
    # Copy to root public and dist
    cp -f "$file" "public/$filename"
    cp -f "$file" "dist/$filename"
    
    # Copy to images subdirectories
    cp -f "$file" "public/images/$filename"
    cp -f "$file" "dist/images/$filename"
    
    echo "Copied $filename to multiple locations"
done

# Copy any public images to dist to ensure they're included
echo "Copying public images to dist..."
find public -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | while read file; do
    filename=$(basename "$file")
    cp -f "$file" "dist/$filename"
    echo "Copied $filename from public to dist"
done

# Copy public/images to dist/images
echo "Copying public/images to dist/images..."
find public/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | while read file; do
    filename=$(basename "$file")
    cp -f "$file" "dist/images/$filename"
    echo "Copied $filename from public/images to dist/images"
done

# Copy public/icons to dist/icons
echo "Copying public/icons to dist/icons..."
find public/icons -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | while read file; do
    filename=$(basename "$file")
    cp -f "$file" "dist/icons/$filename"
    echo "Copied $filename from public/icons to dist/icons"
done

# Special handling for hero image - ensure it's in both root and images directory
echo "Ensuring hero image is in all required locations..."
cp -f "dist/JMEFIT_hero_mirrored.png" "dist/images/JMEFIT_hero_mirrored.png" 2>/dev/null || :
cp -f "public/JMEFIT_hero_mirrored.png" "public/images/JMEFIT_hero_mirrored.png" 2>/dev/null || :

# Set proper permissions
echo "Setting proper permissions..."
find public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) -exec chmod 644 {} \;
find dist -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) -exec chmod 644 {} \;

echo "=== Image count in directories ==="
echo "public/: $(find public -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | wc -l)"
echo "public/images/: $(find public/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | wc -l)"
echo "dist/: $(find dist -maxdepth 1 -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | wc -l)"
echo "dist/images/: $(find dist/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.PNG" -o -name "*.JPG" -o -name "*.JPEG" -o -name "*.GIF" -o -name "*.SVG" -o -name "*.WEBP" \) | wc -l)"

echo "=== All images fixed and copied successfully! ==="
