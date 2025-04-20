#!/bin/bash

# Create directories if they don't exist
mkdir -p public/unsplash-images
mkdir -p dist/unsplash-images

echo "=== DOWNLOADING UNSPLASH IMAGES ==="

# Function to download an image
download_image() {
  local url=$1
  local filename=$2
  
  echo "Downloading $filename from $url"
  curl -s "$url" -o "public/unsplash-images/$filename"
  
  # Copy to dist folder as well
  cp "public/unsplash-images/$filename" "dist/unsplash-images/$filename"
  
  echo "✅ Downloaded and copied $filename"
}

# Download all the Unsplash images used in the project
download_image "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=1200&q=80" "fitness-woman-1.jpg"
download_image "https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=1200&q=80" "healthy-food-1.jpg"
download_image "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80" "workout-1.jpg"
download_image "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80" "nutrition-1.jpg"
download_image "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=80" "fitness-journey.jpg"
download_image "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=2000&q=80" "fitness-home.jpg"
download_image "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80" "home-workout.jpg"
download_image "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80" "strength-training.jpg"
download_image "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80" "hiit-workout.jpg"
download_image "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=80" "monthly-app-bg.jpg"
download_image "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=2000&q=80" "community-bg.jpg"
download_image "https://images.unsplash.com/photo-1504387828636-abeb50778c0c?auto=format&fit=crop&w=800&q=80" "blog-1.jpg"
download_image "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" "blog-2.jpg"
download_image "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80" "blog-3.jpg"

echo "=== ALL UNSPLASH IMAGES DOWNLOADED SUCCESSFULLY ==="
echo "Images are saved in public/unsplash-images/ and dist/unsplash-images/"
