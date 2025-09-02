#!/bin/bash

# Jusivo Deployment Script
# This script builds and prepares the application for deployment

echo "🚀 Starting Jusivo deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npx vite build --mode production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output is in the 'dist' folder"
    echo ""
    echo "🌐 To deploy:"
    echo "   1. Upload the contents of 'dist' folder to your web server"
    echo "   2. Or push to GitHub to trigger automatic deployment via GitHub Actions"
    echo ""
    echo "📋 Build files:"
    ls -la dist/
else
    echo "❌ Build failed!"
    exit 1
fi
