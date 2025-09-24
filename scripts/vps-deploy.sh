#!/bin/bash

# VPS DEPLOYMENT SCRIPT - votingonline2025.site
# Server: root@85.31.224.8

echo "🚀 DEPLOYING TO VPS: votingonline2025.site"
echo "========================================="

# Configuration
VPS_HOST="85.31.224.8"
VPS_USER="root"
VPS_PATH="/home/votingonline2025.site/public_html"
DOMAIN="votingonline2025.site"

echo "📋 VPS Info:"
echo "  Host: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Path: $VPS_PATH"
echo "  Domain: $DOMAIN"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment_package
cp -r . deployment_package/ 2>/dev/null || true
cd deployment_package

# Clean up unnecessary files
echo "🧹 Cleaning deployment package..."
rm -rf node_modules
rm -rf admin/node_modules admin/dist
rm -rf user/node_modules user/dist
rm -rf logs/*.log
rm -rf .git

# Copy VPS environment
cp .env.vps .env.production

echo "✅ Deployment package ready!"
echo ""

echo "📤 NEXT STEPS:"
echo "1. Upload deployment_package to VPS:"
echo "   scp -r deployment_package/* root@85.31.224.8:/home/votingonline2025.site/public_html/"
echo ""
echo "2. SSH to VPS and run setup:"
echo "   ssh root@85.31.224.8"
echo "   cd /home/votingonline2025.site/public_html"
echo "   bash scripts/vps-setup.sh"
echo ""
echo "3. Start production server:"
echo "   npm run vps:start"
echo ""

echo "🎉 Deployment package created successfully!"
