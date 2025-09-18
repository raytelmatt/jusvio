#!/bin/bash

# Firebase Hosting Setup Script
# This script helps set up Firebase hosting deployment

set -e

echo "🔥 Firebase Hosting Setup for Jusivo"
echo "======================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI found: $(firebase --version)"
fi

# Check if we're logged in
echo ""
echo "🔐 Checking Firebase authentication..."
if firebase projects:list &> /dev/null; then
    echo "✅ Already authenticated with Firebase"
    firebase projects:list
else
    echo "❌ Not authenticated. Please login to Firebase:"
    echo "   Run: firebase login"
    echo "   Then run this script again"
    exit 1
fi

# Check if jusivo project exists
echo ""
echo "🏗️ Checking Firebase project 'jusivo'..."
if firebase projects:list | grep -q "jusivo"; then
    echo "✅ Firebase project 'jusivo' found"
else
    echo "❌ Firebase project 'jusivo' not found or no access"
    echo "   Please ensure you have access to the 'jusivo' Firebase project"
    exit 1
fi

# Build the application
echo ""
echo "🏗️ Building application..."
export VITE_BACKEND_PROVIDER=firebase
export VITE_FIREBASE_PROJECT_ID=jusivo
export VITE_FIREBASE_API_KEY=AIzaSyAb45jjLqzrnRYnqc5WlYvvKwYHZhxoU8g
export VITE_FIREBASE_AUTH_DOMAIN=jusivo.firebaseapp.com
export VITE_FIREBASE_STORAGE_BUCKET=jusivo.appspot.com
export VITE_FIREBASE_MESSAGING_SENDER_ID=829325582202
export VITE_FIREBASE_APP_ID=1:829325582202:web:07b6036fa03e2df73f40c3
export VITE_FIREBASE_MEASUREMENT_ID=G-1L2R9BGTM1

npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Firebase Hosting
echo ""
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project jusivo

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Your site should now be available at:"
echo "  • https://jusivo.web.app"
echo "  • https://jusivo.firebaseapp.com"
echo ""
echo "To set up GitHub Actions deployment:"
echo "1. Generate a CI token: firebase login:ci"
echo "2. Add the token as 'FIREBASE_TOKEN' secret in GitHub repository"
echo "3. Push to main branch to trigger automatic deployment"
echo ""