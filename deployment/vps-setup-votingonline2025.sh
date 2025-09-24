#!/bin/bash

# 🎯 VPS Setup Script for votingonline2025.site
# VPS: 85.31.224.8 | CyberPanel
# Run as root: bash vps-setup-votingonline2025.sh

set -e

echo "🚀 Setting up VPS for votingonline2025.site..."

# ==============================================
# SYSTEM UPDATES & DEPENDENCIES
# ==============================================
echo "📦 Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget git build-essential python3-pip

# ==============================================
# NODE.JS 18 INSTALLATION
# ==============================================
echo "🏗️ Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g pm2@latest

# ==============================================
# POSTGRESQL SETUP
# ==============================================
echo "🗄️ Setting up PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
su - postgres -c "createdb voting_production_2025" || true
su - postgres -c "psql -c \"CREATE USER voting_user WITH PASSWORD 'VotingSec2025!';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE voting_production_2025 TO voting_user;\""
su - postgres -c "psql -c \"ALTER USER voting_user CREATEDB;\""

echo "✅ Database voting_production_2025 created with user voting_user"

# ==============================================
# DIRECTORY STRUCTURE
# ==============================================
echo "📁 Creating directory structure..."
mkdir -p /home/votingonline2025.site/{backend,logs,uploads,public_html}
mkdir -p /home/votingonline2025.site/logs/{pm2,nginx,app}

# Set permissions
chown -R www-data:www-data /home/votingonline2025.site/
chmod -R 755 /home/votingonline2025.site/

# ==============================================
# NGINX CONFIGURATION
# ==============================================
echo "🌐 Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/votingonline2025.site << 'EOF'
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
    
    # SSL Configuration (will be updated by CyberPanel)
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
ln -sf /etc/nginx/sites-available/votingonline2025.site /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# ==============================================
# FIREWALL CONFIGURATION
# ==============================================
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Backend API
ufw allow 8080  # WebSocket
ufw allow 8090  # CyberPanel
ufw reload

# ==============================================
# PM2 SETUP
# ==============================================
echo "⚡ Setting up PM2..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

# ==============================================
# MONITORING SETUP
# ==============================================
echo "📊 Setting up monitoring..."
cat > /home/votingonline2025.site/logs/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script
date >> /home/votingonline2025.site/logs/monitor.log
curl -s http://localhost:3000/api/health >> /home/votingonline2025.site/logs/monitor.log 2>&1 || echo "API DOWN" >> /home/votingonline2025.site/logs/monitor.log
EOF

chmod +x /home/votingonline2025.site/logs/monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/votingonline2025.site/logs/monitor.sh") | crontab -

# ==============================================
# COMPLETION
# ==============================================
echo "✅ VPS setup completed for votingonline2025.site!"
echo ""
echo "🎯 Next steps:"
echo "1. 📝 Update DNS records:"
echo "   - votingonline2025.site → 85.31.224.8"
echo "   - admin.votingonline2025.site → 85.31.224.8"  
echo "   - api.votingonline2025.site → 85.31.224.8"
echo ""
echo "2. 🔐 Setup SSL certificates in CyberPanel"
echo "3. 🚀 Deploy backend with PM2"
echo "4. 🌐 Deploy frontends to Netlify"
echo ""
echo "📊 System Status:"
echo "- Database: $(systemctl is-active postgresql)"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- PM2: $(pm2 list | wc -l) processes"
echo ""
echo "🔗 Access URLs:"
echo "- User: https://votingonline2025.site"
echo "- Admin: https://admin.votingonline2025.site"
echo "- API: https://api.votingonline2025.site"
echo "- CyberPanel: https://85.31.224.8:8090"

