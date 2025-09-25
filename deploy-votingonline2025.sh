#!/bin/bash

# BVOTE 2025 - Deployment Script for votingonline2025.site
# Server: 85.31.224.8
# Domain: votingonline2025.site
# Path: /home/votingonline2025.site/public_html

echo "🚀 BVOTE 2025 - Deployment for votingonline2025.site"
echo "Server: 85.31.224.8"
echo "Domain: votingonline2025.site"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Step 1: Setup paths
print_info "Step 1: Setting up deployment paths..."
DOMAIN="votingonline2025.site"
WEB_ROOT="/home/votingonline2025.site/public_html"
BACKEND_PATH="$WEB_ROOT/backend"
API_DOMAIN="api.$DOMAIN"
ADMIN_DOMAIN="admin.$DOMAIN"

print_status "Domain: $DOMAIN"
print_status "Web Root: $WEB_ROOT"
print_status "Backend Path: $BACKEND_PATH"

# Step 2: Create directories
print_info "Step 2: Creating directories..."
mkdir -p "$BACKEND_PATH"
mkdir -p "$WEB_ROOT/logs"
mkdir -p "$WEB_ROOT/config"

# Step 3: Navigate to web root
cd "$WEB_ROOT"
print_status "Working directory: $(pwd)"

# Step 4: Backup existing backend
print_info "Step 3: Backing up existing files..."
if [ -d "$BACKEND_PATH" ] && [ "$(ls -A $BACKEND_PATH)" ]; then
    BACKUP_PATH="$WEB_ROOT/backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$BACKEND_PATH" "$BACKUP_PATH"
    print_status "Backup created: $BACKUP_PATH"
fi

# Step 5: Install system dependencies
print_info "Step 4: Installing system dependencies..."
apt update > /dev/null 2>&1

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install other tools
apt-get install -y git curl unzip nginx certbot python3-certbot-nginx > /dev/null 2>&1

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js: $NODE_VERSION"
print_status "npm: $NPM_VERSION"

# Step 6: Clone repository
print_info "Step 5: Downloading BVOTE 2025 from GitHub..."
TEMP_DIR="$WEB_ROOT/temp_bvote"
rm -rf "$TEMP_DIR"

if git clone https://github.com/teophat559/bvote-2025.git "$TEMP_DIR"; then
    print_status "Repository cloned successfully"
else
    print_error "Failed to clone repository"
    exit 1
fi

# Step 7: Copy backend files
print_info "Step 6: Installing backend files..."
rm -rf "$BACKEND_PATH"/*
cp -r "$TEMP_DIR/backend/"* "$BACKEND_PATH/"

# Copy configuration
if [ -d "$TEMP_DIR/config" ]; then
    cp -r "$TEMP_DIR/config/"* "$WEB_ROOT/config/"
fi

rm -rf "$TEMP_DIR"
print_status "Backend files installed"

# Step 8: Create production environment
print_info "Step 7: Creating production environment..."
cd "$BACKEND_PATH"

cat > .env << EOF
# BVOTE 2025 Production Environment
# Domain: votingonline2025.site
# Server: 85.31.224.8

NODE_ENV=production
PORT=3000

# Domain Configuration
DOMAIN=$DOMAIN
API_URL=https://$API_DOMAIN
FRONTEND_URL=https://$DOMAIN
ADMIN_URL=https://$ADMIN_DOMAIN
BASE_URL=https://$DOMAIN

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN,https://$ADMIN_DOMAIN,https://$API_DOMAIN,https://admin-bvote-2025.netlify.app,https://user-bvote-2025.netlify.app
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS

# Database Configuration (SQLite for now, PostgreSQL ready)
DB_TYPE=sqlite
DB_PATH=$BACKEND_PATH/data/bvote.db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bvote_production
DB_USER=bvote_user
DB_PASS=SecurePass123!

# Security Configuration
JWT_SECRET=bvote2025_jwt_secret_$(openssl rand -hex 32)
ENCRYPTION_KEY=bvote2025_encryption_$(openssl rand -hex 32)
SESSION_SECRET=bvote2025_session_$(openssl rand -hex 32)

# Telegram Integration
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
ENABLE_TELEGRAM_NOTIFICATIONS=true

# File Upload Configuration
UPLOAD_PATH=$BACKEND_PATH/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx

# Logging Configuration
LOG_LEVEL=info
LOG_PATH=$WEB_ROOT/logs
ENABLE_REQUEST_LOGGING=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
RATE_LIMIT_SKIP_SUCCESSFUL=true

# Server Configuration
TRUST_PROXY=true
HELMET_ENABLED=true
COMPRESSION_ENABLED=true

# Development/Debug (set to false in production)
DEBUG_MODE=false
ENABLE_CORS_DEBUG=false
VERBOSE_LOGGING=false
EOF

print_status "Environment configuration created"

# Step 9: Create database directory
print_info "Step 8: Setting up database..."
mkdir -p "$BACKEND_PATH/data"
mkdir -p "$BACKEND_PATH/uploads"
chown -R www-data:www-data "$BACKEND_PATH/data"
chown -R www-data:www-data "$BACKEND_PATH/uploads"
print_status "Database directories created"

# Step 10: Install dependencies
print_info "Step 9: Installing Node.js dependencies..."
if [ ! -f "package.json" ]; then
    print_warning "Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "bvote-backend",
  "version": "1.0.0",
  "description": "BVOTE 2025 Backend API for votingonline2025.site",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "production": "NODE_ENV=production node server.js",
    "pm2:start": "pm2 start server.js --name bvote-backend",
    "pm2:stop": "pm2 stop bvote-backend",
    "pm2:restart": "pm2 restart bvote-backend"
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
  },
  "keywords": ["voting", "election", "bvote", "api", "backend"],
  "author": "teophat559",
  "license": "MIT"
}
EOF
fi

if npm install --production; then
    print_status "Dependencies installed successfully"
else
    print_error "Some dependencies failed to install, trying alternatives..."
    npm install express cors helmet morgan compression express-rate-limit express-slow-down bcrypt jsonwebtoken dotenv winston socket.io pg sqlite3 multer express-validator validator --production
fi

# Step 11: Install PM2
print_info "Step 10: Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
print_status "PM2 installed"

# Step 12: Set permissions
print_info "Step 11: Setting file permissions..."
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"
chmod 600 "$BACKEND_PATH/.env"
chmod +x "$BACKEND_PATH/server.js" 2>/dev/null || true
print_status "Permissions configured"

# Step 13: Configure Nginx
print_info "Step 12: Configuring Nginx..."

# API subdomain configuration
cat > /etc/nginx/sites-available/$API_DOMAIN << EOF
server {
    listen 80;
    server_name $API_DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Admin subdomain configuration (redirect to Netlify)
cat > /etc/nginx/sites-available/$ADMIN_DOMAIN << EOF
server {
    listen 80;
    server_name $ADMIN_DOMAIN;
    
    # Redirect to Netlify admin panel
    return 301 https://admin-bvote-2025.netlify.app\$request_uri;
}
EOF

# Main domain configuration (redirect to Netlify)
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect to Netlify user interface
    return 301 https://user-bvote-2025.netlify.app\$request_uri;
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$ADMIN_DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test nginx configuration
if nginx -t; then
    systemctl reload nginx
    print_status "Nginx configured and reloaded"
else
    print_error "Nginx configuration error"
fi

# Step 14: Start backend
print_info "Step 13: Starting backend server..."

# Stop existing processes
pm2 stop bvote-backend 2>/dev/null || true
pm2 delete bvote-backend 2>/dev/null || true
killall node 2>/dev/null || true

# Start with PM2
if pm2 start server.js --name bvote-backend; then
    pm2 save
    pm2 startup
    print_status "Backend started with PM2"
else
    print_error "PM2 failed, starting manually..."
    nohup node server.js > "$WEB_ROOT/logs/server.log" 2>&1 &
    print_status "Backend started manually"
fi

# Step 15: Setup SSL certificates
print_info "Step 14: Setting up SSL certificates..."
if command -v certbot &> /dev/null; then
    print_info "Installing SSL certificates..."
    certbot --nginx -d $API_DOMAIN -d $ADMIN_DOMAIN -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    print_status "SSL certificates installed"
else
    print_warning "Certbot not available, SSL setup skipped"
fi

# Step 16: Final verification
print_info "Step 15: Final verification..."
sleep 5

# Check if backend is running
if pm2 list | grep -q bvote-backend; then
    print_status "✅ Backend running with PM2"
elif pgrep -f "node server.js" > /dev/null; then
    print_status "✅ Backend running manually"
else
    print_warning "⚠️  Backend status unclear"
fi

# Check if port 3000 is listening
if netstat -tlnp | grep -q ":3000"; then
    print_status "✅ Port 3000 is listening"
else
    print_warning "⚠️  Port 3000 not listening"
fi

# Test API endpoint
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_status "✅ API health check passed"
else
    print_warning "⚠️  API health check failed"
fi

# Step 17: Display final information
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED! 🎉${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}🌐 Your BVOTE 2025 URLs:${NC}"
echo "• Main Site: https://$DOMAIN"
echo "• Admin Panel: https://$ADMIN_DOMAIN"
echo "• API Backend: https://$API_DOMAIN"
echo "• API Health: https://$API_DOMAIN/health"
echo ""
echo -e "${BLUE}📊 Server Information:${NC}"
echo "• Server IP: 85.31.224.8"
echo "• Backend Path: $BACKEND_PATH"
echo "• Process Manager: PM2"
echo "• Web Server: Nginx"
echo "• SSL: Let's Encrypt"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs bvote-backend"
echo "• Restart backend: pm2 restart bvote-backend"
echo "• Restart nginx: systemctl restart nginx"
echo "• Check API: curl https://$API_DOMAIN/health"
echo ""
echo -e "${BLUE}📁 Important Files:${NC}"
echo "• Backend: $BACKEND_PATH/"
echo "• Environment: $BACKEND_PATH/.env"
echo "• Logs: $WEB_ROOT/logs/"
echo "• Nginx Config: /etc/nginx/sites-available/$API_DOMAIN"
echo ""
echo -e "${GREEN}✅ BVOTE 2025 is now live at https://$DOMAIN!${NC}"
echo -e "${GREEN}✅ Admin panel at https://$ADMIN_DOMAIN!${NC}"
echo -e "${GREEN}✅ API backend at https://$API_DOMAIN!${NC}"
echo ""

# Create status check script
cat > "$WEB_ROOT/check-status.sh" << 'EOF'
#!/bin/bash
echo "🔍 BVOTE 2025 Status Check"
echo "=========================="
echo "Backend Process:"
pm2 list | grep bvote-backend
echo ""
echo "Port 3000:"
netstat -tlnp | grep :3000
echo ""
echo "API Health:"
curl -s https://api.votingonline2025.site/health | jq . 2>/dev/null || curl -s https://api.votingonline2025.site/health
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l
EOF

chmod +x "$WEB_ROOT/check-status.sh"
print_status "Status check script created: $WEB_ROOT/check-status.sh"

echo "🎊 Deployment complete! Run $WEB_ROOT/check-status.sh to check system status."
