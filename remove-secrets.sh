#!/bin/bash
# Script to remove sensitive information from the repository

# Create a new branch for the clean repository
git checkout -b clean-repo-no-secrets

# Make sure .env is in .gitignore
if ! grep -q "^\.env$" .gitignore; then
  echo ".env" >> .gitignore
  echo "Added .env to .gitignore"
fi

# Remove .env from git tracking
git rm --cached .env 2>/dev/null || true
echo "Removed .env from git tracking"

# Add and commit the changes
git add .gitignore
git commit -m "Add .env to .gitignore and remove from tracking"

# Push the changes to the new branch
echo "Changes committed. You can now push to a new branch with:"
echo "git push origin clean-repo-no-secrets"

echo "After pushing, update your Netlify site to deploy from this branch."
