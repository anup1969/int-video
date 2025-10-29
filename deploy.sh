#!/bin/bash

# Automated Deployment Script for Netlify
# Run this script to deploy: bash deploy.sh

echo "🚀 Starting Automated Deployment..."
echo ""

# Step 1: Build the application
echo "📦 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Deploy to Netlify
echo "🌐 Deploying to Netlify..."
echo ""
echo "Please follow these steps:"
echo "1. The Netlify CLI will ask you to select a team"
echo "2. Choose your team from the list"
echo "3. Confirm the site name: gtintvideo"
echo ""
echo "Press Enter to continue..."
read

netlify deploy --prod --site gtintvideo

echo ""
echo "🎉 Deployment process complete!"
echo ""
echo "Next steps:"
echo "1. Set up database: Run SQL in Supabase (supabase/setup.sql)"
echo "2. Add environment variables in Netlify dashboard"
echo "3. Test your site!"
echo ""
