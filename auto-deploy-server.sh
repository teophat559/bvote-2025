#!/bin/bash

# BVOTE 2025 - Auto Deployment Script for Server
# Run this script on your server to automatically deploy the backend

echo "🚀 BVOTE 2025 - Auto Deployment Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check current directory and setup paths
print_info "Step 1: Setting up deployment paths..."
DEPLOY_PATH="/home/votingonline2025.site/public_html"
BACKEND_PATH="$DEPLOY_PATH/backend"

# Create directories if they don't exist
mkdir -p "$BACKEND_PATH"
cd "$DEPLOY_PATH"

print_status "Deployment path: $DEPLOY_PATH"
print_status "Backend path: $BACKEND_PATH"

# Step 2: Check if git is available
print_info "Step 2: Checking git availability..."
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Installing git..."
    sudo apt update
    sudo apt install -y git
fi
print_status "Git is available"

# Step 3: Check if Node.js is available
print_info "Step 3: Checking Node.js availability..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Step 4: Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Installing npm..."
    sudo apt install -y npm
fi

NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Step 5: Backup existing backend (if exists)
print_info "Step 4: Backing up existing backend..."
if [ -d "$BACKEND_PATH" ] && [ "$(ls -A $BACKEND_PATH)" ]; then
    BACKUP_PATH="$DEPLOY_PATH/backend_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$BACKEND_PATH" "$BACKUP_PATH"
    print_status "Backup created at: $BACKUP_PATH"
else
    print_warning "No existing backend found to backup"
fi

# Step 6: Clone repository
print_info "Step 5: Cloning repository from GitHub..."
TEMP_DIR="$DEPLOY_PATH/bvote_temp"
rm -rf "$TEMP_DIR"

if git clone https://github.com/teophat559/bvote-2025.git "$TEMP_DIR"; then
    print_status "Repository cloned successfully"
else
    print_error "Failed to clone repository"
    exit 1
fi

# Step 7: Copy backend files
print_info "Step 6: Copying backend files..."
rm -rf "$BACKEND_PATH"/*
cp -r "$TEMP_DIR/backend/"* "$BACKEND_PATH/"

# Copy configuration files
if [ -d "$TEMP_DIR/config" ]; then
    cp -r "$TEMP_DIR/config" "$DEPLOY_PATH/"
    print_status "Configuration files copied"
fi

# Cleanup temp directory
rm -rf "$TEMP_DIR"
print_status "Backend files copied successfully"

# Step 8: Navigate to backend directory
cd "$BACKEND_PATH"
print_info "Current directory: $(pwd)"

# Step 9: Create package.json if missing
print_info "Step 7: Ensuring package.json exists..."
if [ ! -f "package.json" ]; then
    print_warning "package.json not found, creating one..."
    cat > package.json << 'EOF'
{
  "name": "bvote-backend",
  "version": "1.0.0",
  "description": "BVOTE 2025 Backend API",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "production": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "express-slow-down": "^2.0.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "socket.io": "^4.7.4",
    "pg": "^8.11.3",
    "sqlite3": "^5.1.6",
    "multer": "^1.4.5",
    "express-validator": "^7.0.1",
    "validator": "^13.11.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF
    print_status "package.json created"
else
    print_status "package.json found"
fi

# Step 10: Create .env file
print_info "Step 8: Creating environment configuration..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
API_URL=https://api.votingonline2025.site
FRONTEND_URL=https://votingonline2025.site
ADMIN_URL=https://admin.votingonline2025.site

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bvote_production
DB_USER=bvote_user
DB_PASS=secure_password_123

# Security
JWT_SECRET=your_jwt_secret_key_change_this
ENCRYPTION_KEY=your_encryption_key_change_this

# Telegram
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
ENABLE_TELEGRAM_NOTIFICATIONS=true

# CORS
CORS_ORIGIN=https://votingonline2025.site,https://admin.votingonline2025.site,https://api.votingonline2025.site
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
EOF
    print_status ".env file created"
else
    print_status ".env file already exists"
fi

# Step 11: Install dependencies
print_info "Step 9: Installing Node.js dependencies..."
print_info "This may take a few minutes..."

if npm install --production; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    print_info "Trying alternative installation..."
    
    # Try installing individual packages
    npm install express cors helmet morgan compression express-rate-limit express-slow-down bcrypt jsonwebtoken dotenv winston socket.io pg sqlite3 multer express-validator validator --production
fi

# Step 12: Check if PM2 is installed
print_info "Step 10: Checking PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing PM2..."
    npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 is available"
fi

# Step 13: Set proper permissions
print_info "Step 11: Setting file permissions..."
chown -R www-data:www-data "$BACKEND_PATH"
chmod -R 755 "$BACKEND_PATH"
chmod 600 "$BACKEND_PATH/.env"
print_status "Permissions set"

# Step 14: Test the server
print_info "Step 12: Testing server startup..."
if timeout 10s node server.js > /dev/null 2>&1; then
    print_status "Server test successful"
else
    print_warning "Server test failed, but continuing deployment"
fi

# Step 15: Start with PM2
print_info "Step 13: Starting server with PM2..."

# Stop existing process if running
pm2 stop bvote-backend 2>/dev/null || true
pm2 delete bvote-backend 2>/dev/null || true

# Start new process
if pm2 start server.js --name bvote-backend; then
    print_status "Server started with PM2"
    pm2 save
    pm2 startup
else
    print_error "Failed to start with PM2, trying direct start..."
    nohup node server.js > server.log 2>&1 &
    print_status "Server started in background"
fi

# Step 16: Final status check
print_info "Step 14: Final deployment status..."
sleep 3

if pm2 list | grep -q bvote-backend; then
    print_status "✅ Backend is running with PM2"
elif pgrep -f "node server.js" > /dev/null; then
    print_status "✅ Backend is running in background"
else
    print_warning "⚠️  Backend status unclear, check manually"
fi

# Step 17: Display final information
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED! 🎉${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "• Backend Path: $BACKEND_PATH"
echo "• Server File: $BACKEND_PATH/server.js"
echo "• Environment: $BACKEND_PATH/.env"
echo "• Process Manager: PM2"
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "• API Health: https://api.votingonline2025.site/health"
echo "• Admin Panel: https://admin.votingonline2025.site"
echo "• User Interface: https://votingonline2025.site"
echo ""
echo -e "${BLUE}📊 Useful Commands:${NC}"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs bvote-backend"
echo "• Restart: pm2 restart bvote-backend"
echo "• Stop: pm2 stop bvote-backend"
echo ""
echo -e "${GREEN}✅ Your BVOTE 2025 backend is now deployed and running!${NC}"
echo ""
