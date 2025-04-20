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
rsync -av --exclude='.git' --exclude='.env' "/Users/mattysquarzoni/Library/Mobile Documents/com~apple~CloudDocs/Projects-AI/JMEFIT_bolt update/" "$TEMP_DIR/"

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
git commit -m "Initial commit with pricing toggle fixes"

# Add the GitHub repository as a remote
echo "Adding GitHub repository as remote..."
git remote add origin https://github.com/SquizAI/jmefit-clean.git

echo "New repository created at: $TEMP_DIR"
echo "To push to GitHub, first create a new repository on GitHub named 'jmefit-clean'"
echo "Then run:"
echo "cd $TEMP_DIR && git push -u origin main"
echo "After pushing, update your Netlify site to deploy from this new repository."
