#!/bin/bash

# 🚀 VPS Complete Deployment Script - BVOTE 2025
# Triển khai hoàn chỉnh lên VPS votingonline2025.site
# Run: bash vps-deploy-complete.sh

set -e

echo "🎯 Starting complete VPS deployment for BVOTE 2025..."

# ==============================================
# SYSTEM UPDATES & DEPENDENCIES
# ==============================================
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential python3-pip nginx

# ==============================================
# NODE.JS 18 INSTALLATION
# ==============================================
echo "🏗️ Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs
sudo npm install -g pm2@latest netlify-cli

# ==============================================
# POSTGRESQL SETUP
# ==============================================
echo "🗄️ Setting up PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user for votingonline2025.site
sudo -u postgres createdb voti_voting_secure_2025 || true
sudo -u postgres psql -c "CREATE USER voti_voting_user WITH PASSWORD '123133zz@';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voti_voting_secure_2025 TO voti_voting_user;" || true
sudo -u postgres psql -c "ALTER USER voti_voting_user CREATEDB;" || true

echo "✅ Database voti_voting_secure_2025 created with user voti_voting_user"

# ==============================================
# DIRECTORY STRUCTURE
# ==============================================
echo "📁 Creating directory structure..."
sudo mkdir -p /home/votingonline2025.site/{backend,admin,public_html,logs,uploads}
sudo mkdir -p /home/votingonline2025.site/logs/{pm2,nginx,app}

# ==============================================
# CLONE SOURCE CODE
# ==============================================
echo "📥 Cloning source code..."
cd /home/votingonline2025.site/
sudo git clone https://github.com/your-repo/Huse-User.git . || echo "Manual upload required"

# Alternative: Manual upload
echo "📝 If git clone failed, please upload source code manually to /home/votingonline2025.site/"

# ==============================================
# INSTALL DEPENDENCIES
# ==============================================
echo "📦 Installing application dependencies..."

# Backend dependencies
cd /home/votingonline2025.site/backend/
sudo npm install --production
sudo npm install express-slow-down express-rate-limit helmet cors morgan

# Admin build
cd /home/votingonline2025.site/admin/
sudo npm install
sudo npm run build
sudo cp -r dist/* /home/votingonline2025.site/admin/

# User build  
cd /home/votingonline2025.site/user/
sudo npm install
sudo npm run build
sudo cp -r dist/* /home/votingonline2025.site/public_html/

# ==============================================
# ENVIRONMENT CONFIGURATION
# ==============================================
echo "⚙️ Setting up environment configuration..."
cd /home/votingonline2025.site/backend/

# Copy production environment
sudo cp ../config/production-votingonline2025.env .env

# Create production config if not exists
sudo tee .env > /dev/null << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://voti_voting_user:123133zz@@localhost:5432/voti_voting_secure_2025
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voti_voting_secure_2025
DB_USER=voti_voting_user
DB_PASSWORD=123133zz@

# Domain
DOMAIN=votingonline2025.site
BASE_URL=https://votingonline2025.site
CLIENT_URL=https://votingonline2025.site
ADMIN_URL=https://admin.votingonline2025.site
API_BASE_URL=https://api.votingonline2025.site

# CORS
CORS_ORIGIN=https://votingonline2025.site,https://admin.votingonline2025.site,https://api.votingonline2025.site
CORS_CREDENTIALS=true

# Security
JWT_SECRET=votingonline2025_secure_jwt_secret_2025_production
JWT_REFRESH_SECRET=votingonline2025_secure_refresh_secret_2025_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Features
LOG_LEVEL=info
ENABLE_HEALTH_CHECKS=true
ENABLE_METRICS=true
ENABLE_RATE_LIMITING=true
MAX_CONCURRENT_SESSIONS=5
EOF

# ==============================================
# NGINX CONFIGURATION
# ==============================================
echo "🌐 Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/votingonline2025.site > /dev/null << 'EOF'
# votingonline2025.site - User Frontend
server {
    listen 80;
    server_name votingonline2025.site www.votingonline2025.site;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name votingonline2025.site www.votingonline2025.site;
    
    # SSL Configuration (will be updated by CyberPanel/Certbot)
    ssl_certificate /etc/letsencrypt/live/votingonline2025.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votingonline2025.site/privkey.pem;
    
    root /home/votingonline2025.site/public_html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# admin.votingonline2025.site - Admin Frontend  
server {
    listen 80;
    server_name admin.votingonline2025.site;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.votingonline2025.site;
    
    ssl_certificate /etc/letsencrypt/live/votingonline2025.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votingonline2025.site/privkey.pem;
    
    root /home/votingonline2025.site/admin;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# api.votingonline2025.site - Backend API
server {
    listen 80;
    server_name api.votingonline2025.site;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.votingonline2025.site;
    
    ssl_certificate /etc/letsencrypt/live/votingonline2025.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votingonline2025.site/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/votingonline2025.site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ==============================================
# PM2 ECOSYSTEM CONFIGURATION
# ==============================================
echo "⚡ Setting up PM2 ecosystem..."
cd /home/votingonline2025.site/backend/

sudo tee ecosystem-production.config.js > /dev/null << 'EOF'
module.exports = {
  apps: [{
    name: 'bvote-backend',
    script: 'server.js',
    cwd: '/home/votingonline2025.site/backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/votingonline2025.site/logs/pm2/error.log',
    out_file: '/home/votingonline2025.site/logs/pm2/out.log',
    log_file: '/home/votingonline2025.site/logs/pm2/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# ==============================================
# SET PERMISSIONS
# ==============================================
echo "🔐 Setting up permissions..."
sudo chown -R www-data:www-data /home/votingonline2025.site/
sudo chmod -R 755 /home/votingonline2025.site/
sudo chown -R $USER:$USER /home/votingonline2025.site/backend/node_modules/

# ==============================================
# START SERVICES
# ==============================================
echo "🚀 Starting services..."

# Start backend with PM2
cd /home/votingonline2025.site/backend/
pm2 start ecosystem-production.config.js
pm2 save
pm2 startup

# ==============================================
# FIREWALL CONFIGURATION
# ==============================================
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Backend API
sudo ufw reload

# ==============================================
# SSL CERTIFICATE SETUP
# ==============================================
echo "🔒 Setting up SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx

# Request SSL certificates for all domains
sudo certbot --nginx -d votingonline2025.site -d www.votingonline2025.site -d admin.votingonline2025.site -d api.votingonline2025.site --non-interactive --agree-tos --email admin@votingonline2025.site

# Auto-renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# ==============================================
# MONITORING SETUP
# ==============================================
echo "📊 Setting up monitoring..."
sudo tee /home/votingonline2025.site/logs/monitor.sh > /dev/null << 'EOF'
#!/bin/bash
# Health monitoring script
date >> /home/votingonline2025.site/logs/monitor.log
curl -s http://localhost:3000/health >> /home/votingonline2025.site/logs/monitor.log 2>&1 || echo "API DOWN" >> /home/votingonline2025.site/logs/monitor.log
EOF

sudo chmod +x /home/votingonline2025.site/logs/monitor.sh

# Add to crontab for monitoring
(sudo crontab -l 2>/dev/null; echo "*/5 * * * * /home/votingonline2025.site/logs/monitor.sh") | sudo crontab -

# ==============================================
# COMPLETION
# ==============================================
echo ""
echo "🎉 ==============================================="
echo "✅ VPS DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "🌐 Your sites are now live at:"
echo "   👥 User Interface: https://votingonline2025.site"
echo "   🔧 Admin Panel: https://admin.votingonline2025.site"  
echo "   ⚡ Backend API: https://api.votingonline2025.site"
echo ""
echo "📊 System Status:"
echo "   - Database: $(sudo systemctl is-active postgresql)"
echo "   - Nginx: $(sudo systemctl is-active nginx)"
echo "   - PM2 Backend: $(pm2 list | grep -c online || echo 0) processes"
echo ""
echo "🔧 Management Commands:"
echo "   - View backend logs: pm2 logs"
echo "   - Restart backend: pm2 restart all"
echo "   - Monitor system: pm2 monit"
echo "   - Check health: curl https://api.votingonline2025.site/health"
echo ""
echo "📝 Next Steps:"
echo "   1. Update DNS records to point to your VPS IP"
echo "   2. Test all functionalities"
echo "   3. Setup backup procedures"
echo ""
echo "🎊 BVOTE 2025 is now fully deployed and operational!"
