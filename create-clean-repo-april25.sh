#!/bin/bash
# Script to create a completely new repository without any history of sensitive information

# Create a temporary directory for the new repository
TEMP_DIR="/tmp/clean-jmefit-$(date +%s)"
echo "Creating temporary directory: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Initialize a new Git repository in the temporary directory
echo "Initializing new Git repository..."
cd "$TEMP_DIR"
git init

# Copy all files from the current repository to the new one, excluding .git and .env
echo "Copying files to new repository..."
rsync -av --exclude='.git' --exclude='.env' --exclude='node_modules' "/Users/mattysquarzoni/Library/Mobile Documents/com~apple~CloudDocs/Projects-AI/JMEFIT_bolt update/" "$TEMP_DIR/"

# Run the cleaning scripts in the new repository
echo "Cleaning any remaining secrets..."
cd "$TEMP_DIR"
chmod +x clean-stripe-secrets.sh
./clean-stripe-secrets.sh
chmod +x clean-oauth-secrets.sh
./clean-oauth-secrets.sh

# Add .env to .gitignore if it's not already there
if ! grep -q "^\.env$" .gitignore; then
  echo ".env" >> .gitignore
  echo "Added .env to .gitignore"
fi

# Add all files to the new repository
echo "Adding files to new repository..."
git add .

# Commit the files
echo "Committing files..."
git commit -m "Initial commit with comprehensive README"

# Add the GitHub repository as a remote
echo "Adding GitHub repository as remote..."
git remote add origin https://github.com/SquizAI/JMEFIT_20april25.git

echo "New repository created at: $TEMP_DIR"
echo "Now pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Process complete. Check if the push was successful."
