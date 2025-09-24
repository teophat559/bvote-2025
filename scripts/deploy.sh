#!/bin/bash

# ===================================
# DEPLOYMENT SCRIPT - DEFAULT TEMPLATE
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
PORT=3000

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}🚀 STARTING DEPLOYMENT${NC}"
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
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

print_success "All required files found"

# Build frontend applications
print_step "Building frontend applications..."

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

# Create deployment package
print_step "Creating deployment package..."
PACKAGE_NAME="$PROJECT_NAME-$(date +%Y%m%d_%H%M%S).tar.gz"

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
    ecosystem.default.config.js \
    package.json

print_success "Package created: $PACKAGE_NAME"

# Upload to VPS
print_step "Uploading to VPS..."
scp "$PACKAGE_NAME" "$VPS_USER@$VPS_HOST:$VPS_PATH/"

print_success "Package uploaded to VPS"

# Deploy on VPS
print_step "Deploying on VPS..."
ssh "$VPS_USER@$VPS_HOST" << EOF
cd $VPS_PATH

# Create backup
if [ -d "current" ]; then
    echo "Creating backup..."
    sudo mkdir -p $BACKUP_PATH
    sudo tar -czf $BACKUP_PATH/backup-\$(date +%Y%m%d_%H%M%S).tar.gz current/
fi

# Extract new version
echo "Extracting new version..."
tar -xzf $PACKAGE_NAME
rm $PACKAGE_NAME

# Stop existing processes
echo "Stopping existing processes..."
sudo pkill -f "node.*server" || true
sudo pm2 stop all || true

# Setup environment
echo "Setting up environment..."
cp config.production.default.env .env
chmod 600 .env

# Install dependencies
echo "Installing production dependencies..."
cd backend
npm install --production
cd ..

# Setup database
echo "Setting up database..."
mysql -u root -p < database-setup.default.sql

# Start application
echo "Starting application..."
sudo pm2 start ecosystem.default.config.js
sudo pm2 save
sudo pm2 startup

# Setup nginx (if not using OpenLiteSpeed)
if command -v nginx &> /dev/null; then
    echo "Configuring nginx..."
    sudo systemctl reload nginx
fi

echo "✅ Deployment completed successfully!"
EOF

# Cleanup
print_step "Cleaning up local files..."
rm "$PACKAGE_NAME"
print_success "Local cleanup completed"

# Health check
print_step "Performing health check..."
sleep 10
if curl -f "https://$DOMAIN/api/health" > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_error "Health check failed - please check the application"
fi

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Application URL: https://$DOMAIN${NC}"
echo -e "${GREEN}Admin URL: https://admin.$DOMAIN${NC}"
echo -e "${GREEN}API Health: https://$DOMAIN/api/health${NC}"

print_step "Next steps:"
echo "1. Update your domain DNS settings"
echo "2. Configure SSL certificate"
echo "3. Test all functionality"
echo "4. Monitor application logs"

exit 0
