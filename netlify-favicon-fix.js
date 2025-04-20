// netlify-favicon-fix.js - Ensures favicons are properly deployed to Netlify
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('=== NETLIFY FAVICON FIX SCRIPT ===');

// Define source and destination directories
const publicDir = 'public';
const distDir = 'dist';

// Create destination directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy all favicon files from public to dist
const faviconFiles = glob.sync(`${publicDir}/favicon*.*`);
faviconFiles.forEach(file => {
  const fileName = path.basename(file);
  const destPath = path.join(distDir, fileName);
  fs.copyFileSync(file, destPath);
  console.log(`Copied ${fileName} to ${distDir}`);
});

// Copy manifest and apple-touch-icon
const otherFiles = [
  'apple-touch-icon.png',
  'manifest.webmanifest',
  'manifest.json'
];

otherFiles.forEach(fileName => {
  const sourcePath = path.join(publicDir, fileName);
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(distDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${fileName} to ${distDir}`);
  } else {
    console.log(`Warning: ${fileName} not found in ${publicDir}`);
  }
});

console.log('=== NETLIFY FAVICON FIX COMPLETE ===');
