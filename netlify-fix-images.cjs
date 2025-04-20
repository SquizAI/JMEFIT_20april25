// netlify-fix-images.cjs
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to copy files
function copyFiles(sourcePattern, destDir) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

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

// Main function
function main() {
  console.log('=== Netlify Image Fix Script ===');
  
  // Define source and destination directories
  const sourceDir = 'src/assets/images';
  const publicDir = 'public';
  const publicImagesDir = 'public/images';
  const distDir = 'dist';
  const distImagesDir = 'dist/images';
  
  // Copy all image files from source to various destinations
  copyFiles(`${sourceDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, publicDir);
  copyFiles(`${sourceDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, publicImagesDir);
  copyFiles(`${sourceDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, distDir);
  copyFiles(`${sourceDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, distImagesDir);
  
  // Also copy from public to dist to ensure everything is in the final build
  copyFiles(`${publicDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, distDir);
  copyFiles(`${publicImagesDir}/*.{png,jpg,jpeg,PNG,JPG,JPEG,svg,SVG,webp,WEBP,gif,GIF}`, distImagesDir);
  
  console.log('=== Image fix complete ===');
}

// Run the main function
main();
