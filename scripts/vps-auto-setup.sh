#!/bin/bash

# 🚀 AUTOMATED VPS SETUP FOR VOTINGONLINE2025.SITE
# Tự động hóa hoàn toàn setup VPS
# Run on VPS: curl -sSL https://raw.githubusercontent.com/your-repo/main/scripts/vps-auto-setup.sh | bash

set -e

# ==============================================
# COLORS & FUNCTIONS
# ==============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_step() {
    echo -e "${BLUE}🔧 [$1] $2${NC}"
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
# CONFIGURATION
# ==============================================
DOMAIN="votingonline2025.site"
DB_NAME="voting_production_2025"
DB_USER="voting_user"
DB_PASS="VotingSec2025!"
NODE_VERSION="18"

print_header "🚀 AUTOMATED VPS SETUP FOR $DOMAIN"

# ==============================================
# STEP 1: SYSTEM UPDATE
# ==============================================
print_step "1/12" "Updating system packages..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null 2>&1
apt-get upgrade -y >/dev/null 2>&1
apt-get install -y curl wget git build-essential python3-pip software-properties-common >/dev/null 2>&1

print_success "System updated successfully"

# ==============================================
# STEP 2: NODE.JS INSTALLATION
# ==============================================
print_step "2/12" "Installing Node.js $NODE_VERSION..."

curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
apt-get install -y nodejs >/dev/null 2>&1

# Install PM2 globally
npm install -g pm2@latest >/dev/null 2>&1

print_success "Node.js $(node --version) and PM2 installed"

# ==============================================
# STEP 3: POSTGRESQL SETUP
# ==============================================
print_step "3/12" "Setting up PostgreSQL..."

apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1

# Start and enable PostgreSQL
systemctl start postgresql >/dev/null 2>&1
systemctl enable postgresql >/dev/null 2>&1

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1 || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" >/dev/null 2>&1 || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" >/dev/null 2>&1
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" >/dev/null 2>&1

print_success "PostgreSQL configured with database: $DB_NAME"

# ==============================================
# STEP 4: NGINX INSTALLATION
# ==============================================
print_step "4/12" "Installing and configuring Nginx..."

apt-get install -y nginx >/dev/null 2>&1

# Create nginx configuration
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# User Frontend - votingonline2025.site
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL will be configured by CyberPanel
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    root /home/$DOMAIN/public_html;
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin Frontend - admin.votingonline2025.site
server {
    listen 80;
    server_name admin.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    root /home/$DOMAIN/admin;
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

# Backend API - api.votingonline2025.site
server {
    listen 80;
    server_name api.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

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

        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
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
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t >/dev/null 2>&1 && systemctl reload nginx

print_success "Nginx configured for $DOMAIN"

# ==============================================
# STEP 5: DIRECTORY STRUCTURE
# ==============================================
print_step "5/12" "Creating directory structure..."

mkdir -p /home/$DOMAIN/{backend,admin,public_html,logs,uploads}
mkdir -p /home/$DOMAIN/logs/{pm2,nginx,app}

# Set permissions
chown -R www-data:www-data /home/$DOMAIN/
chmod -R 755 /home/$DOMAIN/

print_success "Directory structure created"

# ==============================================
# STEP 6: FIREWALL CONFIGURATION
# ==============================================
print_step "6/12" "Configuring firewall..."

ufw --force enable >/dev/null 2>&1
ufw allow 22 >/dev/null 2>&1    # SSH
ufw allow 80 >/dev/null 2>&1    # HTTP
ufw allow 443 >/dev/null 2>&1   # HTTPS
ufw allow 3000 >/dev/null 2>&1  # Backend API
ufw allow 8080 >/dev/null 2>&1  # WebSocket
ufw allow 8090 >/dev/null 2>&1  # CyberPanel
ufw reload >/dev/null 2>&1

print_success "Firewall configured"

# ==============================================
# STEP 7: PM2 CONFIGURATION
# ==============================================
print_step "7/12" "Setting up PM2..."

# Install PM2 log rotation
pm2 install pm2-logrotate >/dev/null 2>&1
pm2 set pm2-logrotate:compress true >/dev/null 2>&1
pm2 set pm2-logrotate:retain 7 >/dev/null 2>&1

# Setup PM2 startup
pm2 startup >/dev/null 2>&1 || true

print_success "PM2 configured"

# ==============================================
# STEP 8: SSL PREPARATION
# ==============================================
print_step "8/12" "Preparing SSL configuration..."

# Install certbot
apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1

print_success "SSL tools installed"

# ==============================================
# STEP 9: DATABASE INITIALIZATION
# ==============================================
print_step "9/12" "Initializing database schema..."

# Create database initialization script
cat > /tmp/init_db.sql << EOF
-- Create database schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    max_votes_per_user INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    featured_image TEXT,
    total_votes INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user
INSERT INTO users (email, username, password_hash, full_name, role, is_verified, is_active)
VALUES (
    'admin@$DOMAIN',
    'admin',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFNRULBWwOYAkm2',
    'System Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
EOF

# Run database initialization
sudo -u postgres psql -d $DB_NAME -f /tmp/init_db.sql >/dev/null 2>&1
rm -f /tmp/init_db.sql

print_success "Database schema initialized"

# ==============================================
# STEP 10: MONITORING SETUP
# ==============================================
print_step "10/12" "Setting up monitoring..."

# Create monitoring script
cat > /home/$DOMAIN/logs/monitor.sh << EOF
#!/bin/bash
# Simple monitoring script
date >> /home/$DOMAIN/logs/monitor.log
curl -s http://localhost:3000/api/health >> /home/$DOMAIN/logs/monitor.log 2>&1 || echo "API DOWN" >> /home/$DOMAIN/logs/monitor.log
EOF

chmod +x /home/$DOMAIN/logs/monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$DOMAIN/logs/monitor.sh") | crontab -

print_success "Monitoring configured"

# ==============================================
# STEP 11: SYSTEM OPTIMIZATION
# ==============================================
print_step "11/12" "Optimizing system..."

# Optimize PostgreSQL
sed -i "s/#max_connections = 100/max_connections = 200/" /etc/postgresql/*/main/postgresql.conf
sed -i "s/#shared_buffers = 128MB/shared_buffers = 256MB/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
systemctl restart postgresql >/dev/null 2>&1

# Optimize Nginx
sed -i 's/worker_connections 768;/worker_connections 1024;/' /etc/nginx/nginx.conf

print_success "System optimized"

# ==============================================
# STEP 12: FINAL VERIFICATION
# ==============================================
print_step "12/12" "Running final verification..."

# Check services
SERVICES=("postgresql" "nginx")
for service in "${SERVICES[@]}"; do
    if systemctl is-active --quiet $service; then
        print_success "$service is running"
    else
        print_warning "$service may not be running properly"
    fi
done

# Check database connection
if sudo -u postgres psql -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_warning "Database connection may have issues"
fi

# ==============================================
# COMPLETION SUMMARY
# ==============================================
print_header "🎉 VPS SETUP COMPLETED SUCCESSFULLY!"

echo -e "${GREEN}✅ System Status:${NC}"
echo "   - OS: $(lsb_release -d | cut -f2)"
echo "   - Node.js: $(node --version)"
echo "   - PostgreSQL: $(sudo -u postgres psql --version | head -1)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo "   - PM2: $(pm2 --version)"

echo -e "\n${BLUE}📊 Database Info:${NC}"
echo "   - Database: $DB_NAME"
echo "   - User: $DB_USER"
echo "   - Password: $DB_PASS"

echo -e "\n${BLUE}📁 Directory Structure:${NC}"
echo "   - Backend: /home/$DOMAIN/backend"
echo "   - Admin: /home/$DOMAIN/admin"
echo "   - User: /home/$DOMAIN/public_html"
echo "   - Logs: /home/$DOMAIN/logs"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. 🚀 Deploy backend application to /home/$DOMAIN/backend"
echo "2. 🌐 Deploy frontend files to respective directories"
echo "3. 🔐 Setup SSL certificates with CyberPanel or certbot"
echo "4. 🔧 Configure domain DNS to point to this server"
echo "5. ✅ Test all services and functionalities"

echo -e "\n${PURPLE}🔗 Access URLs (after DNS setup):${NC}"
echo "   - User Site: https://$DOMAIN"
echo "   - Admin Panel: https://admin.$DOMAIN"
echo "   - Backend API: https://api.$DOMAIN"

echo -e "\n${GREEN}🎉 VPS is ready for deployment!${NC}"
