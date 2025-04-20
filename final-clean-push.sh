#!/bin/bash
# Script to create a final clean repository without ANY sensitive information or patterns

# Create a temporary directory for the new repository
TEMP_DIR="/tmp/clean-jmefit-final-$(date +%s)"
echo "Creating temporary directory: $TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Initialize a new Git repository in the temporary directory
echo "Initializing new Git repository..."
cd "$TEMP_DIR"
git init

# Copy all files from the current repository to the new one, excluding problematic files
echo "Copying files to new repository..."
rsync -av --exclude='.git' \
         --exclude='.env' \
         --exclude='node_modules' \
         --exclude='sensitive-patterns.txt' \
         --exclude='clean-git-history.sh' \
         --exclude='clean-secrets.sh' \
         --exclude='clean-stripe-secrets.sh' \
         --exclude='clean-oauth-secrets.sh' \
         --exclude='scripts/setup-shop-products.js' \
         --exclude='scripts/stripe-direct-test.sh' \
         --exclude='scripts/update-stripe-keys.sh' \
         --exclude='scripts/test-stripe-api.sh' \
         --exclude='supabase/config.toml' \
         --exclude='update-supabase-auth.sh' \
         --exclude='update-supabase-config.js' \
         --exclude='update-supabase-config.mjs' \
         "/Users/mattysquarzoni/Library/Mobile Documents/com~apple~CloudDocs/Projects-AI/JMEFIT_bolt update/" "$TEMP_DIR/"

# Add entries to .gitignore
cat >> .gitignore << EOL
# Sensitive files
.env
.env.*
!.env.example
sensitive-patterns.txt
scripts/setup-shop-products.js
scripts/stripe-direct-test.sh
scripts/update-stripe-keys.sh
scripts/test-stripe-api.sh
supabase/config.toml
update-supabase-auth.sh
update-supabase-config.js
update-supabase-config.mjs
EOL

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
