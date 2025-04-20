#!/bin/bash
# Script to update Google Client ID in .env file

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

# Update the Google Client ID in .env file
sed -i '' 's/VITE_GOOGLE_CLIENT_ID=.*/VITE_GOOGLE_CLIENT_ID=744335481357-gi2jh7lkni32uop3v1jb1290v9o3ubr1.apps.googleusercontent.com/' .env

echo "Google Client ID updated successfully in .env file!"
echo "Remember to rebuild your application for the changes to take effect."
