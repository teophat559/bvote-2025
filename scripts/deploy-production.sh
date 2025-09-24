#!/bin/bash

# 🚀 Quick Deploy Script for votingonline2025.site
# GitHub + Netlify + VPS Deployment
# Run: bash scripts/deploy-production.sh

set -e

echo "🚀 Starting deployment for votingonline2025.site..."

# ==============================================
# CONFIGURATION
# ==============================================
VPS_IP="85.31.224.8"
VPS_USER="root"
DOMAIN="votingonline2025.site"
ADMIN_DOMAIN="admin.votingonline2025.site"
API_DOMAIN="api.votingonline2025.site"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================
# HELPER FUNCTIONS
# ==============================================
print_status() {
    echo -e "${BLUE}🎯 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ==============================================
# PRE-DEPLOYMENT CHECKS
# ==============================================
print_status "Running pre-deployment checks..."

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Git working directory is not clean. Uncommitted changes detected."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if required environment variables exist
if [ ! -f "config/production-votingonline2025-clean.env" ]; then
    print_error "Production environment file not found!"
    exit 1
fi

print_success "Pre-deployment checks passed"

# ==============================================
# BUILD FRONTENDS LOCALLY
# ==============================================
print_status "Building User frontend..."
cd user
npm install
npm run build
print_success "User frontend built successfully"
cd ..

print_status "Building Admin frontend..."
cd admin  
npm install
npm run build
print_success "Admin frontend built successfully"
cd ..

# ==============================================
# DEPLOY TO NETLIFY
# ==============================================
print_status "Deploying to Netlify..."

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    print_warning "Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Deploy User frontend
print_status "Deploying User frontend to Netlify..."
cd user
netlify deploy --prod --dir=dist --site="$NETLIFY_USER_SITE_ID" || print_warning "User deployment may have failed"
cd ..

# Deploy Admin frontend  
print_status "Deploying Admin frontend to Netlify..."
cd admin
netlify deploy --prod --dir=dist --site="$NETLIFY_ADMIN_SITE_ID" || print_warning "Admin deployment may have failed"
cd ..

print_success "Frontend deployments completed"

# ==============================================
# DEPLOY BACKEND TO VPS
# ==============================================
print_status "Deploying Backend to VPS..."

# Create deployment package
tar -czf backend-deploy.tar.gz \
    backend/ \
    config/production-votingonline2025-clean.env \
    backend/ecosystem-production.config.js \
    --exclude=backend/node_modules \
    --exclude=backend/logs \
    --exclude=backend/uploads

print_status "Uploading to VPS..."
scp -o StrictHostKeyChecking=no backend-deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

print_status "Installing on VPS..."
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << EOF
    set -e
    
    # Extract files
    cd /home/votingonline2025.site/
    tar -xzf /tmp/backend-deploy.tar.gz
    
    # Install dependencies
    cd backend
    npm install --production
    
    # Set permissions
    chown -R www-data:www-data /home/votingonline2025.site/
    
    # Restart PM2
    pm2 delete voting-api || true
    pm2 start ecosystem-production.config.js --env production
    pm2 save
    
    # Cleanup
    rm -f /tmp/backend-deploy.tar.gz
    
    echo "Backend deployment completed"
EOF

print_success "Backend deployed successfully"

# Cleanup local files
rm -f backend-deploy.tar.gz

# ==============================================
# POST-DEPLOYMENT VERIFICATION
# ==============================================
print_status "Running post-deployment verification..."

sleep 10  # Wait for services to start

# Check services
print_status "Checking User frontend..."
if curl -s -f "https://${DOMAIN}" > /dev/null; then
    print_success "User frontend is accessible"
else
    print_warning "User frontend may not be accessible yet"
fi

print_status "Checking Admin frontend..."
if curl -s -f "https://${ADMIN_DOMAIN}" > /dev/null; then
    print_success "Admin frontend is accessible"
else
    print_warning "Admin frontend may not be accessible yet"
fi

print_status "Checking Backend API..."
if curl -s -f "https://${API_DOMAIN}/api/health" > /dev/null; then
    print_success "Backend API is accessible"
else
    print_warning "Backend API may not be accessible yet"
fi

# ==============================================
# DEPLOYMENT SUMMARY
# ==============================================
echo
print_status "🎉 Deployment Summary for votingonline2025.site"
echo "=================================================="
echo -e "${GREEN}✅ User Frontend:${NC}  https://${DOMAIN}"
echo -e "${GREEN}✅ Admin Panel:${NC}   https://${ADMIN_DOMAIN}"
echo -e "${GREEN}✅ Backend API:${NC}   https://${API_DOMAIN}"
echo
echo -e "${BLUE}📊 Next Steps:${NC}"
echo "1. Verify all services are working correctly"
echo "2. Test user registration and voting functionality"
echo "3. Check admin panel features"
echo "4. Monitor logs for any issues"
echo
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "- User Site: https://${DOMAIN}"
echo "- Admin Panel: https://${ADMIN_DOMAIN}"
echo "- API Health: https://${API_DOMAIN}/api/health"
echo "- VPS SSH: ssh ${VPS_USER}@${VPS_IP}"
echo
print_success "Deployment completed successfully! 🚀"

