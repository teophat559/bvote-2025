#!/bin/bash

# BVOTE VPS Deployment Script
# Production-ready deployment for VPS servers

set -e

echo "🚀 Starting BVOTE VPS Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bvote"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
DOMAIN="yourdomain.com"
ADMIN_DOMAIN="admin.yourdomain.com"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  App Name: $APP_NAME"
echo "  App Directory: $APP_DIR"
echo "  Domain: $DOMAIN"
echo "  Admin Domain: $ADMIN_DOMAIN"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
    pm2 startup
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Nginx...${NC}"
    sudo apt update
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

# Create app directory
echo -e "${YELLOW}📁 Setting up directories...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Copy application files
echo -e "${YELLOW}📋 Copying application files...${NC}"
cp -r backend $APP_DIR/
cp -r config $APP_DIR/
cp package.json $APP_DIR/
cp ecosystem.config.js $APP_DIR/

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd $APP_DIR
npm install
cd backend && npm install

# Build frontend applications
echo -e "${YELLOW}🏗️ Building frontend applications...${NC}"
cd ../admin && npm install && npm run build
cd ../user && npm install && npm run build

# Copy built frontend to nginx directory
echo -e "${YELLOW}📋 Setting up static files...${NC}"
sudo mkdir -p /var/www/html/$APP_NAME
sudo cp -r admin/dist/* /var/www/html/$APP_NAME/admin/
sudo cp -r user/dist/* /var/www/html/$APP_NAME/

# Create Nginx configuration
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo tee $NGINX_CONF > /dev/null <<EOF
# BVOTE Production Configuration
server {
    listen 80;
    server_name $DOMAIN;

    # User App (Main Domain)
    location / {
        root /var/www/html/$APP_NAME;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Admin Subdomain
server {
    listen 80;
    server_name $ADMIN_DOMAIN;

    # Admin Panel
    location / {
        root /var/www/html/$APP_NAME/admin;
        try_files \$uri \$uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy (same as main domain)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable Nginx site
echo -e "${YELLOW}🔗 Enabling Nginx site...${NC}"
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up PM2
echo -e "${YELLOW}🔄 Setting up PM2...${NC}"
cd $APP_DIR
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# Create logs directory
sudo mkdir -p /var/log/$APP_NAME
sudo chown -R $USER:$USER /var/log/$APP_NAME

# Set up log rotation
sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo -e "${GREEN}🌐 Your application is available at:${NC}"
echo "  Main App: http://$DOMAIN"
echo "  Admin Panel: http://$ADMIN_DOMAIN"
echo "  API Health: http://$DOMAIN/api/health"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Set up SSL certificates (Let's Encrypt recommended)"
echo "  2. Configure your domain DNS to point to this server"
echo "  3. Update production environment variables"
echo "  4. Set up database connection"
echo ""
echo -e "${YELLOW}🔍 Monitoring:${NC}"
echo "  PM2 Status: pm2 status"
echo "  PM2 Logs: pm2 logs $APP_NAME"
echo "  Nginx Status: sudo systemctl status nginx"
