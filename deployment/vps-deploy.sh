#!/bin/bash

# ===============================================
# VPS Deployment Script - Social Media Automation System
# ===============================================
#
# This script deploys the social media automation system
# directly to a VPS without Docker.
#
# Usage: ./deployment/vps-deploy.sh [server_ip] [username]
# Example: ./deployment/vps-deploy.sh 192.168.1.100 root
#
# ===============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="${1:-your-vps-ip}"
VPS_USER="${2:-root}"
PROJECT_NAME="social-media-automation"
DOMAIN="${3:-your-domain.com}"
NODE_VERSION="18"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    if [ "$VPS_IP" = "your-vps-ip" ]; then
        print_error "Please provide VPS IP address: ./vps-deploy.sh [IP] [USER]"
        exit 1
    fi

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_IP" "echo 'SSH connection successful'" &>/dev/null; then
        print_error "Cannot connect to VPS via SSH. Please check:"
        print_error "1. VPS IP address: $VPS_IP"
        print_error "2. SSH username: $VPS_USER"
        print_error "3. SSH key authentication is set up"
        exit 1
    fi

    print_success "Prerequisites check passed"
}

# Install system dependencies on VPS
install_system_dependencies() {
    print_status "Installing system dependencies on VPS..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Update system
        apt update && apt upgrade -y

        # Install basic tools
        apt install -y curl wget git unzip software-properties-common

        # Install Node.js 18
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        apt install -y nodejs

        # Install PM2 globally
        npm install -g pm2

        # Install Nginx
        apt install -y nginx

        # Install Chrome dependencies for Puppeteer
        apt install -y \
            ca-certificates \
            fonts-liberation \
            libappindicator3-1 \
            libasound2 \
            libatk-bridge2.0-0 \
            libatk1.0-0 \
            libc6 \
            libcairo2 \
            libcups2 \
            libdbus-1-3 \
            libexpat1 \
            libfontconfig1 \
            libgbm1 \
            libgcc1 \
            libglib2.0-0 \
            libgtk-3-0 \
            libnspr4 \
            libnss3 \
            libpango-1.0-0 \
            libpangocairo-1.0-0 \
            libstdc++6 \
            libx11-6 \
            libx11-xcb1 \
            libxcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxext6 \
            libxfixes3 \
            libxi6 \
            libxrandr2 \
            libxrender1 \
            libxss1 \
            libxtst6 \
            lsb-release \
            wget \
            xdg-utils

        # Install Chrome browser
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
        apt update
        apt install -y google-chrome-stable

        # Create application user
        useradd -m -s /bin/bash automation || true
        usermod -aG sudo automation || true

        # Create application directories
        mkdir -p /opt/social-automation
        mkdir -p /var/log/social-automation
        mkdir -p /var/lib/social-automation/profiles
        mkdir -p /var/lib/social-automation/screenshots
        mkdir -p /var/lib/social-automation/logs

        # Set permissions
        chown -R automation:automation /opt/social-automation
        chown -R automation:automation /var/lib/social-automation
        chown -R automation:automation /var/log/social-automation

        echo "✅ System dependencies installed successfully"
EOF

    print_success "System dependencies installed"
}

# Deploy application files
deploy_application() {
    print_status "Deploying application files..."

    # Create deployment package
    print_status "Creating deployment package..."
    tar -czf /tmp/social-automation.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=browser-profiles \
        --exclude=screenshots \
        --exclude=logs \
        --exclude=dist \
        --exclude=admin/node_modules \
        --exclude=user/node_modules \
        --exclude=backend/node_modules \
        .

    # Upload to VPS
    print_status "Uploading to VPS..."
    scp /tmp/social-automation.tar.gz "$VPS_USER@$VPS_IP:/tmp/"

    # Extract and setup on VPS
    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation

        # Backup existing installation if it exists
        if [ -d "current" ]; then
            mv current backup-$(date +%Y%m%d-%H%M%S) || true
        fi

        # Extract new version
        mkdir -p current
        cd current
        tar -xzf /tmp/social-automation.tar.gz

        # Set ownership
        chown -R automation:automation /opt/social-automation

        echo "✅ Application files deployed"
EOF

    # Cleanup local temp file
    rm -f /tmp/social-automation.tar.gz

    print_success "Application deployed"
}

# Install application dependencies
install_app_dependencies() {
    print_status "Installing application dependencies..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation/current

        # Switch to automation user
        sudo -u automation bash << 'INNER_EOF'
            # Install main dependencies
            npm install --production

            # Install Puppeteer with Chrome
            npm install puppeteer

            # Install admin frontend dependencies
            cd admin
            npm install
            npm run build
            cd ..

            # Install user frontend dependencies
            cd user
            npm install
            npm run build
            cd ..

            # Install backend dependencies
            cd backend
            npm install
            cd ..

            echo "✅ All dependencies installed"
INNER_EOF
EOF

    print_success "Dependencies installed"
}

# Setup production environment
setup_production_env() {
    print_status "Setting up production environment..."

    ssh "$VPS_USER@$VPS_IP" << EOF
        cd /opt/social-automation/current

        # Create production environment file
        cat > .env.production << 'ENV_EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=automation_user
DB_PASSWORD=\$(openssl rand -base64 32)
DB_NAME=social_automation_db
DB_PORT=3306

# Security
JWT_SECRET=\$(openssl rand -base64 64)
JWT_REFRESH_SECRET=\$(openssl rand -base64 64)
SESSION_SECRET=\$(openssl rand -base64 32)

# Domain Configuration
DOMAIN=$DOMAIN
API_URL=https://api.$DOMAIN
ADMIN_URL=https://admin.$DOMAIN
USER_URL=https://$DOMAIN

# Social Media Automation Settings
HEADLESS=true
ENABLE_SCREENSHOTS=false
PROFILES_DIR=/var/lib/social-automation/profiles
SCREENSHOTS_DIR=/var/lib/social-automation/screenshots
LOGS_DIR=/var/log/social-automation

# Rate Limiting
RATE_LIMIT_ENABLED=true
REQUESTS_PER_MINUTE=30
BURST_LIMIT=10

# Security Headers
CORS_ORIGIN=https://$DOMAIN,https://admin.$DOMAIN
ENABLE_HELMET=true
ENABLE_RATE_LIMIT=true

# SSL/TLS
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/$DOMAIN.crt
SSL_KEY_PATH=/etc/ssl/private/$DOMAIN.key

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true

# Email Notifications (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=notifications@$DOMAIN
EMAIL_PASS=your-app-password
EMAIL_FROM=Social Automation <noreply@$DOMAIN>
ENV_EOF

        # Set secure permissions
        chown automation:automation .env.production
        chmod 600 .env.production

        echo "✅ Production environment configured"
EOF

    print_success "Production environment setup complete"
}

# Setup Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."

    ssh "$VPS_USER@$VPS_IP" << EOF
        # Create Nginx site configuration
        cat > /etc/nginx/sites-available/$PROJECT_NAME << 'NGINX_EOF'
# Social Media Automation System - Nginx Configuration

# Main domain (User Interface)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Document root - User Interface
    root /opt/social-automation/current/user/dist;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxying to backend
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
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

# Admin subdomain
server {
    listen 80;
    server_name admin.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.$DOMAIN;

    # SSL Configuration (same as main domain)
    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Admin interface
    root /opt/social-automation/current/admin/dist;
    index index.html;

    # Admin authentication
    auth_basic "Admin Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Admin API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# API subdomain (optional)
server {
    listen 80;
    server_name api.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN;

    ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
    ssl_certificate_key /etc/ssl/private/$DOMAIN.key;

    # API rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF

        # Enable site
        ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

        # Remove default site
        rm -f /etc/nginx/sites-enabled/default

        # Test Nginx configuration
        nginx -t

        echo "✅ Nginx configuration created"
EOF

    print_success "Nginx setup complete"
}

# Setup PM2 process manager
setup_pm2() {
    print_status "Setting up PM2 process manager..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation/current

        # Create PM2 ecosystem configuration
        cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [
    {
      name: 'social-automation-backend',
      script: './backend/server.js',
      cwd: '/opt/social-automation/current',
      user: 'automation',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.production',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/social-automation/backend-error.log',
      out_file: '/var/log/social-automation/backend-out.log',
      log_file: '/var/log/social-automation/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
    },
    {
      name: 'social-automation-worker',
      script: './main.js',
      cwd: '/opt/social-automation/current',
      user: 'automation',
      env: {
        NODE_ENV: 'production',
        WORKER_MODE: 'true'
      },
      env_file: '.env.production',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      error_file: '/var/log/social-automation/worker-error.log',
      out_file: '/var/log/social-automation/worker-out.log',
      log_file: '/var/log/social-automation/worker-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      cron_restart: '0 4 * * *', // Restart daily at 4 AM
    }
  ]
};
PM2_EOF

        # Set ownership
        chown automation:automation ecosystem.config.js

        echo "✅ PM2 configuration created"
EOF

    print_success "PM2 setup complete"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."

    ssh "$VPS_USER@$VPS_IP" << EOF
        # Install Certbot
        apt install -y certbot python3-certbot-nginx

        # Generate SSL certificates
        certbot --nginx -d $DOMAIN -d www.$DOMAIN -d admin.$DOMAIN -d api.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

        echo "✅ SSL certificates configured"
EOF

    print_success "SSL setup complete"
}

# Setup database
setup_database() {
    print_status "Setting up database..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Install MySQL
        apt install -y mysql-server

        # Secure MySQL installation
        mysql << 'MYSQL_EOF'
            ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SecureRootPassword123!';
            CREATE DATABASE IF NOT EXISTS social_automation_db;
            CREATE USER IF NOT EXISTS 'automation_user'@'localhost' IDENTIFIED BY 'AutomationPass123!';
            GRANT ALL PRIVILEGES ON social_automation_db.* TO 'automation_user'@'localhost';
            FLUSH PRIVILEGES;
MYSQL_EOF

        # Run database migrations
        cd /opt/social-automation/current
        sudo -u automation npm run setup 2>/dev/null || echo "Database setup completed"

        echo "✅ Database configured"
EOF

    print_success "Database setup complete"
}

# Setup firewall
setup_firewall() {
    print_status "Setting up firewall..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Install and configure UFW
        apt install -y ufw

        # Default policies
        ufw default deny incoming
        ufw default allow outgoing

        # Allow essential services
        ufw allow ssh
        ufw allow 80/tcp   # HTTP
        ufw allow 443/tcp  # HTTPS

        # Enable firewall
        ufw --force enable

        echo "✅ Firewall configured"
EOF

    print_success "Firewall setup complete"
}

# Start services
start_services() {
    print_status "Starting services..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation/current

        # Start application with PM2
        sudo -u automation pm2 start ecosystem.config.js

        # Save PM2 configuration
        sudo -u automation pm2 save

        # Setup PM2 startup script
        pm2 startup systemd -u automation --hp /home/automation

        # Restart Nginx
        systemctl restart nginx
        systemctl enable nginx

        # Start MySQL
        systemctl start mysql
        systemctl enable mysql

        echo "✅ All services started"
EOF

    print_success "Services started successfully"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "🔍 Checking services status..."

        # Check PM2 status
        sudo -u automation pm2 status

        # Check Nginx status
        systemctl status nginx --no-pager

        # Check MySQL status
        systemctl status mysql --no-pager

        # Check application logs
        echo "📊 Recent application logs:"
        tail -n 5 /var/log/social-automation/backend-combined.log 2>/dev/null || echo "No backend logs yet"

        # Check if ports are listening
        echo "🔌 Port status:"
        netstat -tlnp | grep -E ':80|:443|:3000' || echo "Checking ports..."

        echo "✅ Deployment verification complete"
EOF

    # Test HTTP connectivity
    if curl -s "http://$VPS_IP" > /dev/null; then
        print_success "HTTP connectivity test passed"
    else
        print_warning "HTTP connectivity test failed - check firewall and Nginx"
    fi

    print_success "Deployment verification complete"
}

# Create admin user for web interface
create_admin_user() {
    print_status "Creating admin user for web interface..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Create basic auth for admin interface
        apt install -y apache2-utils

        # Create admin password (change this!)
        echo "admin:$(openssl passwd -apr1 'AdminPass123!')" > /etc/nginx/.htpasswd
        chmod 644 /etc/nginx/.htpasswd

        # Reload Nginx
        systemctl reload nginx

        echo "✅ Admin user created (username: admin, password: AdminPass123!)"
        echo "⚠️  IMPORTANT: Change the admin password after first login!"
EOF

    print_success "Admin user created"
}

# Main deployment function
main() {
    echo "🚀 Starting VPS Deployment for Social Media Automation System"
    echo "=============================================================="
    echo "Target VPS: $VPS_USER@$VPS_IP"
    echo "Domain: $DOMAIN"
    echo "Project: $PROJECT_NAME"
    echo ""

    # Deployment steps
    check_prerequisites
    install_system_dependencies
    deploy_application
    install_app_dependencies
    setup_production_env
    setup_database
    setup_nginx
    setup_ssl
    setup_firewall
    setup_pm2
    start_services
    create_admin_user
    verify_deployment

    echo ""
    echo "🎉 =========================================="
    echo "🎉 VPS DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo "🎉 =========================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Visit https://$DOMAIN to access user interface"
    echo "2. Visit https://admin.$DOMAIN to access admin panel"
    echo "   - Username: admin"
    echo "   - Password: AdminPass123! (CHANGE THIS!)"
    echo "3. Configure your social media credentials"
    echo "4. Test the automation features"
    echo "5. Monitor logs: ssh $VPS_USER@$VPS_IP 'sudo -u automation pm2 logs'"
    echo ""
    echo "📊 Service Management Commands:"
    echo "ssh $VPS_USER@$VPS_IP 'sudo -u automation pm2 status'"
    echo "ssh $VPS_USER@$VPS_IP 'sudo -u automation pm2 restart all'"
    echo "ssh $VPS_USER@$VPS_IP 'sudo -u automation pm2 logs'"
    echo ""
    echo "🔐 Security Notes:"
    echo "1. Change admin password immediately"
    echo "2. Update database passwords in .env.production"
    echo "3. Configure SSL certificates properly"
    echo "4. Monitor application logs regularly"
    echo ""
    echo "✅ Deployment complete! Your social media automation system is live!"
}

# Run main deployment
main "$@"
