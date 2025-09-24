#!/bin/bash

# ===================================
# CYBERPANEL DEPLOYMENT SCRIPT - DEFAULT TEMPLATE
# ===================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="voting-system"
DOMAIN="your-domain.com"
VPS_USER="root"
VPS_HOST="your-vps-ip"
VPS_PATH="/home/$DOMAIN/public_html"
BACKUP_PATH="/home/backups"
NODE_VERSION="18"
PORT=3000

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}🚀 CYBERPANEL DEPLOYMENT${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to print step
print_step() {
    echo -e "${YELLOW}➤ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate configuration
print_step "Validating configuration..."
if [ "$DOMAIN" == "your-domain.com" ]; then
    print_error "Please update DOMAIN in this script"
    exit 1
fi

if [ "$VPS_HOST" == "your-vps-ip" ]; then
    print_error "Please update VPS_HOST in this script"
    exit 1
fi

print_success "Configuration validated"

# Check if required files exist
print_step "Checking required files..."
required_files=(
    "config.production.default.env"
    "server-production.default.js"
    "database-setup.default.sql"
    ".htaccess.template"
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_success "All required files found"

# Build applications
print_step "Building applications..."

# Build admin app
if [ -d "admin" ]; then
    echo "Building admin application..."
    cd admin
    npm install --production
    npm run build
    cd ..
    print_success "Admin app built"
fi

# Build user app
if [ -d "user" ]; then
    echo "Building user application..."
    cd user
    npm install --production
    npm run build
    cd ..
    print_success "User app built"
fi

# Install backend dependencies
print_step "Installing backend dependencies..."
cd backend
npm install --production
cd ..
print_success "Backend dependencies installed"

# Create CyberPanel package
print_step "Creating CyberPanel package..."
PACKAGE_NAME="cyberpanel-$PROJECT_NAME-$(date +%Y%m%d_%H%M%S).tar.gz"

# Create htaccess from template
cp .htaccess.template .htaccess

tar -czf "$PACKAGE_NAME" \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.git' \
    --exclude='temp' \
    backend/ \
    admin/dist/ \
    user/dist/ \
    config.production.default.env \
    server-production.default.js \
    database-setup.default.sql \
    .htaccess \
    package.json

print_success "CyberPanel package created: $PACKAGE_NAME"

# Upload to VPS
print_step "Uploading to VPS..."
scp "$PACKAGE_NAME" "$VPS_USER@$VPS_HOST:/tmp/"
print_success "Package uploaded to VPS"

# Deploy on VPS with CyberPanel
print_step "Deploying on CyberPanel VPS..."
ssh "$VPS_USER@$VPS_HOST" << EOF
# Create backup
if [ -d "$VPS_PATH" ] && [ "\$(ls -A $VPS_PATH)" ]; then
    echo "Creating backup..."
    mkdir -p $BACKUP_PATH
    tar -czf $BACKUP_PATH/backup-\$(date +%Y%m%d_%H%M%S).tar.gz $VPS_PATH/
fi

# Extract to website directory
echo "Extracting to website directory..."
cd $VPS_PATH
tar -xzf /tmp/$PACKAGE_NAME
rm /tmp/$PACKAGE_NAME

# Setup environment
echo "Setting up environment..."
cp config.production.default.env .env
chmod 600 .env

# Update domain in .env
sed -i "s/your-domain.com/$DOMAIN/g" .env

# Setup Node.js via CyberPanel Node.js Selector
echo "Setting up Node.js..."
if command -v /usr/local/CyberCP/bin/NodeJS/nodejsmanager &> /dev/null; then
    echo "Using CyberPanel Node.js Manager..."
    # Note: This needs to be configured via CyberPanel interface
    echo "⚠️  Configure Node.js $NODE_VERSION via CyberPanel Node.js Selector"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd $VPS_PATH/backend
npm install --production --no-optional
cd $VPS_PATH

# Setup database
echo "Setting up database..."
# Update database connection in SQL file
sed -i "s/your_db_user/\$DB_USER/g" database-setup.default.sql
sed -i "s/your_password/\$DB_PASSWORD/g" database-setup.default.sql

echo "⚠️  Please run database setup manually:"
echo "mysql -u \$DB_USER -p\$DB_PASSWORD < database-setup.default.sql"

# Setup file permissions
echo "Setting up file permissions..."
chown -R \$USER:\$USER $VPS_PATH
chmod -R 755 $VPS_PATH
chmod 644 $VPS_PATH/.htaccess

# Copy static files to public html root
echo "Setting up static files..."
if [ -d "$VPS_PATH/admin/dist" ]; then
    cp -r $VPS_PATH/admin/dist/* $VPS_PATH/admin/ || true
fi

if [ -d "$VPS_PATH/user/dist" ]; then
    cp -r $VPS_PATH/user/dist/* $VPS_PATH/ || true
fi

echo "✅ CyberPanel deployment completed!"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo "1. Configure Node.js $NODE_VERSION via CyberPanel → Node.js Selector"
echo "2. Set application startup file: server-production.default.js"
echo "3. Set application port: $PORT"
echo "4. Configure database via CyberPanel → Database"
echo "5. Run database setup: mysql -u \$DB_USER -p < database-setup.default.sql"
echo "6. Configure SSL certificate via CyberPanel → SSL"
echo "7. Test application: https://$DOMAIN/api/health"
echo ""
EOF

# Cleanup
print_step "Cleaning up local files..."
rm "$PACKAGE_NAME"
rm .htaccess
print_success "Local cleanup completed"

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}🎉 CYBERPANEL DEPLOYMENT READY${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Application URL: https://$DOMAIN${NC}"
echo -e "${GREEN}CyberPanel: https://$VPS_HOST:8090${NC}"

echo -e "${YELLOW}=================================${NC}"
echo -e "${YELLOW}📋 NEXT STEPS IN CYBERPANEL:${NC}"
echo -e "${YELLOW}=================================${NC}"
echo "1. Login to CyberPanel: https://$VPS_HOST:8090"
echo "2. Go to Node.js → Node.js Selector"
echo "3. Select domain: $DOMAIN"
echo "4. Set Node.js version: $NODE_VERSION"
echo "5. Set startup file: server-production.default.js"
echo "6. Set port: $PORT"
echo "7. Configure database and run SQL setup"
echo "8. Enable SSL certificate"
echo "9. Test application health"

exit 0
