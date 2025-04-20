// netlify-image-fix.js - Ensures images are properly deployed to Netlify
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { glob } from 'glob';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== NETLIFY IMAGE FIX SCRIPT ===');

// Define source and destination directories
const publicDir = 'public';
const distDir = 'dist';
const publicImagesDir = path.join(publicDir, 'images');
const distImagesDir = path.join(distDir, 'images');

// Create destination directories if they don't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(distImagesDir)) {
  fs.mkdirSync(distImagesDir, { recursive: true });
}

// Function to copy files
function copyFiles(sourcePattern, destDir) {
  // Find all files matching the pattern
  const files = glob.sync(sourcePattern);
  
  console.log(`Copying ${files.length} files from ${sourcePattern} to ${destDir}`);
  
  // Copy each file
  files.forEach(file => {
    const fileName = path.basename(file);
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(file, destPath);
    console.log(`Copied ${fileName} to ${destDir}`);
  });
}

// Special handling for hero image - ensure it's in both root and images directory
console.log('Ensuring hero image is in all required locations...');
const heroImage = path.join(publicDir, 'JMEFIT_hero_mirrored.png');
if (fs.existsSync(heroImage)) {
  // Copy to dist root
  fs.copyFileSync(heroImage, path.join(distDir, 'JMEFIT_hero_mirrored.png'));
  console.log('Copied JMEFIT_hero_mirrored.png to dist root');
  
  // Copy to dist/images
  fs.copyFileSync(heroImage, path.join(distImagesDir, 'JMEFIT_hero_mirrored.png'));
  console.log('Copied JMEFIT_hero_mirrored.png to dist/images');
}

// Copy all image files from public to dist
console.log('Copying all images from public to dist...');
copyFiles(`${publicDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF,ico}`, distDir);

// Copy all image files from public/images to dist/images
console.log('Copying all images from public/images to dist/images...');
copyFiles(`${publicImagesDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF,ico}`, distImagesDir);

// Copy OG images for social media sharing
const publicOgDir = path.join(publicDir, 'og');
const distOgDir = path.join(distDir, 'og');

// Create og directory in dist if it doesn't exist
if (fs.existsSync(publicOgDir)) {
  if (!fs.existsSync(distOgDir)) {
    fs.mkdirSync(distOgDir, { recursive: true });
  }
  
  console.log('Copying OG images from public/og to dist/og...');
  copyFiles(`${publicOgDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, distOgDir);
}

// Copy video files for social media sharing
const publicVideosDir = path.join(publicDir, 'videos');
const distVideosDir = path.join(distDir, 'videos');

// Create videos directory in dist if it doesn't exist
if (fs.existsSync(publicVideosDir)) {
  if (!fs.existsSync(distVideosDir)) {
    fs.mkdirSync(distVideosDir, { recursive: true });
  }
  
  console.log('Copying video files from public/videos to dist/videos...');
  copyFiles(`${publicVideosDir}/*.{mp4,webm,ogg,MP4,WEBM,OGG}`, distVideosDir);
}

// Copy all favicon files to ensure they're in the root
console.log('Copying favicon files to dist root...');
copyFiles(`${publicDir}/favicon*.*`, distDir);
copyFiles(`${publicDir}/apple-touch-icon.png`, distDir);
copyFiles(`${publicDir}/manifest.webmanifest`, distDir);

console.log('=== NETLIFY IMAGE FIX COMPLETE ===');
