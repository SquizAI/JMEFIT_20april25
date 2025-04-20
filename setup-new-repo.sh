#!/bin/bash
# Script to set up a new GitHub repository and push the clean code

# Instructions for creating a new GitHub repository
echo "===== STEP 1: CREATE A NEW GITHUB REPOSITORY ====="
echo "1. Go to https://github.com/new"
echo "2. Name the repository 'jmefit-clean'"
echo "3. Set it to Private"
echo "4. Do NOT initialize with README, .gitignore, or license"
echo "5. Click 'Create repository'"
echo ""
echo "Press Enter after you've created the repository..."
read -p ""

# Push the clean code to the new repository
echo "===== STEP 2: PUSHING CLEAN CODE TO NEW REPOSITORY ====="
cd /tmp/clean-jmefit-1743785241
git push -u origin main

# If push fails, provide instructions for authentication
if [ $? -ne 0 ]; then
  echo ""
  echo "Push failed. You may need to authenticate with GitHub."
  echo "Try the following:"
  echo "1. Go to GitHub and generate a personal access token:"
  echo "   https://github.com/settings/tokens"
  echo "2. Then run these commands:"
  echo "   cd /tmp/clean-jmefit-1743785241"
  echo "   git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/SquizAI/jmefit-clean.git"
  echo "   git push -u origin main"
  exit 1
fi

# Instructions for updating Netlify
echo ""
echo "===== STEP 3: UPDATE NETLIFY TO USE THE NEW REPOSITORY ====="
echo "1. Go to your Netlify site dashboard: https://app.netlify.com/sites/jmefitlanding/overview"
echo "2. Click on 'Site settings'"
echo "3. Go to 'Build & deploy' > 'Continuous Deployment'"
echo "4. Click 'Edit settings' and then 'Link to a different repository'"
echo "5. Select the new 'jmefit-clean' repository"
echo "6. Set the branch to 'main'"
echo "7. Save the changes"
echo ""
echo "After updating Netlify, trigger a new deployment to see your pricing toggle fixes live."
