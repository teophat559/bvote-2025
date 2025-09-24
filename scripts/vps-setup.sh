#!/bin/bash

# VPS SETUP SCRIPT - Run this on the VPS server
# votingonline2025.site

echo "🛠️ VPS SETUP - votingonline2025.site"
echo "===================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18+ (if not installed)
echo "🟢 Installing/Updating Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version:"
node --version
npm --version

# Install PM2 for process management
echo "🔄 Installing PM2..."
npm install -g pm2

# Install dependencies
echo "📚 Installing project dependencies..."
npm install --production

# Install frontend dependencies and build
echo "🎨 Building frontend applications..."
cd admin && npm install && npm run build
cd ../user && npm install && npm run build
cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
chmod 755 logs uploads

# Setup MySQL database (if needed)
echo "🗄️ Database setup..."
# mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS voti_voting_secure_2025;"
# mysql -u root -p -e "GRANT ALL PRIVILEGES ON voti_voting_secure_2025.* TO 'voti_voting_user'@'localhost';"

# Setup environment
echo "🔧 Setting up environment..."
cp .env.vps .env.production
chmod 600 .env.production

# Setup PM2 ecosystem
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'bvote-backend',
      script: 'backend/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

# Setup Nginx configuration (optional)
echo "🌐 Creating Nginx configuration template..."
cat > nginx-votingonline2025.conf << 'EOF'
server {
    listen 80;
    server_name votingonline2025.site www.votingonline2025.site;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votingonline2025.site www.votingonline2025.site;

    # SSL Configuration (update paths as needed)
    # ssl_certificate /path/to/your/cert.pem;
    # ssl_certificate_key /path/to/your/key.pem;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
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

    # Admin Frontend
    location /admin/ {
        alias /home/votingonline2025.site/public_html/admin/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # User Frontend
    location / {
        root /home/votingonline2025.site/public_html/user/dist;
        try_files $uri $uri/ /index.html;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ VPS Setup completed!"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Start the application:"
echo "   npm run vps:start"
echo ""
echo "2. Check status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "3. Setup Nginx (if using):"
echo "   cp nginx-votingonline2025.conf /etc/nginx/sites-available/"
echo "   ln -s /etc/nginx/sites-available/nginx-votingonline2025.conf /etc/nginx/sites-enabled/"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "4. Setup SSL certificate:"
echo "   certbot --nginx -d votingonline2025.site -d www.votingonline2025.site"
echo ""
echo "🎉 VPS is ready for production!"
