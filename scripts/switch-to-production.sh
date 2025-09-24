#!/bin/bash

# 🎯 Switch to Production Configuration
# Thay thế hoàn toàn localhost bằng votingonline2025.site
# Run: bash scripts/switch-to-production.sh

set -e

echo "🎯 Switching to Production Configuration for votingonline2025.site..."

# ==============================================
# COLORS FOR OUTPUT
# ==============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ==============================================
# BACKUP EXISTING CONFIGS
# ==============================================
print_status "Creating backup of existing configurations..."

mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Backup existing configs
cp admin/netlify.toml "$BACKUP_DIR/admin-netlify.toml.bak" 2>/dev/null || true
cp user/netlify.toml "$BACKUP_DIR/user-netlify.toml.bak" 2>/dev/null || true
cp netlify.toml "$BACKUP_DIR/root-netlify.toml.bak" 2>/dev/null || true
cp backend/ecosystem.config.js "$BACKUP_DIR/ecosystem.config.js.bak" 2>/dev/null || true

print_success "Configs backed up to $BACKUP_DIR"

# ==============================================
# REPLACE ADMIN NETLIFY CONFIG
# ==============================================
print_status "Updating Admin Netlify configuration..."

cp admin/netlify-production.toml admin/netlify.toml
print_success "Admin Netlify config updated"

# ==============================================
# REPLACE USER NETLIFY CONFIG  
# ==============================================
print_status "Updating User Netlify configuration..."

cp user/netlify-production.toml user/netlify.toml
print_success "User Netlify config updated"

# ==============================================
# UPDATE ROOT NETLIFY CONFIG
# ==============================================
print_status "Updating root Netlify configuration..."

cat > netlify.toml << 'EOF'
# 🎯 votingonline2025.site - Root Config
# Redirects to appropriate frontend

[build]
  publish = "user/dist"
  command = "cd user && npm install && npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
  VITE_APP_ENV = "production"
  VITE_USE_MOCK = "0"
  VITE_API_URL = "https://api.votingonline2025.site/api"
  VITE_SOCKET_URL = "https://api.votingonline2025.site"
  VITE_BASE_URL = "https://votingonline2025.site"

# Redirect admin routes to subdomain
[[redirects]]
  from = "/admin/*"
  to = "https://admin.votingonline2025.site/:splat"
  status = 301

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

print_success "Root Netlify config updated"

# ==============================================
# UPDATE BACKEND ECOSYSTEM CONFIG
# ==============================================
print_status "Updating Backend PM2 configuration..."

cp backend/ecosystem-production.config.js backend/ecosystem.config.js
print_success "Backend PM2 config updated"

# ==============================================
# UPDATE ENVIRONMENT FILES
# ==============================================
print_status "Updating environment files..."

# Update admin env
cat > admin/.env.production << 'EOF'
VITE_APP_ENV=production
VITE_USE_MOCK=0
VITE_API_URL=https://api.votingonline2025.site/api
VITE_SOCKET_URL=https://api.votingonline2025.site
VITE_BASE_URL=https://admin.votingonline2025.site
VITE_ENABLE_CONSOLE_LOGS=0
VITE_LOG_LEVEL=error
VITE_ENABLE_REALTIME=1
VITE_ENABLE_AUDIT_LOG=1
VITE_APP_NAME=BVOTE Admin
VITE_BUILD_VERSION=2.0.0-production
EOF

# Update user env
cat > user/.env.production << 'EOF'
VITE_APP_ENV=production
VITE_USE_MOCK=0
VITE_API_URL=https://api.votingonline2025.site/api
VITE_SOCKET_URL=https://api.votingonline2025.site
VITE_BASE_URL=https://votingonline2025.site
VITE_ENABLE_CONSOLE_LOGS=0
VITE_LOG_LEVEL=error
VITE_ENABLE_REALTIME=1
VITE_ENABLE_NOTIFICATIONS=1
VITE_ENABLE_KYC=1
VITE_ENABLE_VOTING=1
VITE_APP_NAME=BVOTE User
VITE_BUILD_VERSION=2.0.0-production
EOF

# Update backend env
cp config/production-votingonline2025-clean.env backend/.env.production

print_success "Environment files updated"

# ==============================================
# UPDATE BUILD CONFIGS
# ==============================================
print_status "Updating build configurations..."

# Update admin switch-environment script
sed -i 's|programbvote2025.online|api.votingonline2025.site|g' admin/switch-environment.js 2>/dev/null || true
sed -i 's|bvote.com|votingonline2025.site|g' admin/build-config.js 2>/dev/null || true

print_success "Build configs updated"

# ==============================================
# UPDATE PACKAGE.JSON SCRIPTS
# ==============================================
print_status "Updating package.json scripts..."

# Update admin package.json
if [ -f admin/package.json ]; then
    # Add production build script if not exists
    if ! grep -q "build:prod" admin/package.json; then
        sed -i '/"build":/a\    "build:prod": "NODE_ENV=production vite build",' admin/package.json
    fi
fi

# Update user package.json
if [ -f user/package.json ]; then
    # Add production build script if not exists
    if ! grep -q "build:prod" user/package.json; then
        sed -i '/"build":/a\    "build:prod": "NODE_ENV=production vite build",' user/package.json
    fi
fi

print_success "Package.json scripts updated"

# ==============================================
# VERIFY CONFIGURATIONS
# ==============================================
print_status "Verifying configurations..."

# Check if production configs exist
if [ -f admin/netlify.toml ] && [ -f user/netlify.toml ] && [ -f backend/ecosystem.config.js ]; then
    print_success "All configuration files present"
else
    print_warning "Some configuration files may be missing"
fi

# Check for localhost references
if grep -r "localhost:3000" admin/netlify.toml user/netlify.toml 2>/dev/null; then
    print_warning "Found localhost references in Netlify configs"
else
    print_success "No localhost references in Netlify configs"
fi

# ==============================================
# SUMMARY
# ==============================================
echo
print_status "🎉 Production Configuration Switch Summary"
echo "=================================================="
echo -e "${GREEN}✅ Admin Netlify:${NC}    Updated to production config"
echo -e "${GREEN}✅ User Netlify:${NC}     Updated to production config"  
echo -e "${GREEN}✅ Backend PM2:${NC}      Updated to production config"
echo -e "${GREEN}✅ Environment:${NC}      Production env files created"
echo -e "${GREEN}✅ Build Scripts:${NC}    Updated for production"
echo
echo -e "${BLUE}📂 Backup Location:${NC}   $BACKUP_DIR"
echo
echo -e "${BLUE}🔗 Production URLs:${NC}"
echo "- User Site:     https://votingonline2025.site"
echo "- Admin Panel:   https://admin.votingonline2025.site"
echo "- Backend API:   https://api.votingonline2025.site"
echo
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Test build locally:     npm run build (in admin/ and user/)"
echo "2. Deploy to VPS:          bash scripts/deploy-production.sh"
echo "3. Setup DNS records:      Point domains to 85.31.224.8"
echo "4. Configure SSL:          Use CyberPanel Let's Encrypt"
echo
print_success "Ready for production deployment! 🚀"

