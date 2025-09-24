#!/bin/bash

# VPS DEPLOYMENT với NEW ROUTING STRUCTURE
# User: votingonline2025.site (root)
# Admin: votingonline2025.site/admin (subfolder)

echo "🚀 VPS DEPLOYMENT - NEW ROUTING STRUCTURE"
echo "========================================="
echo "User Interface: votingonline2025.site (root)"
echo "Admin Panel: votingonline2025.site/admin"
echo ""

# 1. Basic setup
apt update && apt upgrade -y
apt install -y nginx nodejs npm mysql-server curl wget

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs
npm install -g pm2

# 2. Create directories
mkdir -p /home/votingonline2025.site/public_html
mkdir -p /home/votingonline2025.site/{logs,data,uploads}

# 3. Setup database
mysql -e "CREATE DATABASE IF NOT EXISTS voti_voting_secure_2025;"
mysql -e "CREATE USER IF NOT EXISTS 'voti_voting_user'@'localhost' IDENTIFIED BY '123123zz@';"
mysql -e "GRANT ALL PRIVILEGES ON voti_voting_secure_2025.* TO 'voti_voting_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 4. Deploy application (after extraction)
cd /home/votingonline2025.site/public_html

# Install dependencies
npm install --production

# Copy environment
cp env.production .env

# 5. Configure Nginx với new routing
cp production/nginx-new-routing.conf /etc/nginx/sites-available/votingonline2025.site

# Remove default và enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/votingonline2025.site /etc/nginx/sites-enabled/

# Test và reload
nginx -t && systemctl reload nginx

# 6. Set permissions
chown -R www-data:www-data /home/votingonline2025.site/public_html
chmod 644 /home/votingonline2025.site/public_html/{index.html,.htaccess}

# 7. Start services
pm2 delete all || true
pm2 start simple-production-server.js --name "voting-app" --env production
pm2 start backend/server-production.js --name "voting-api" --env production || echo "Backend will start later"
pm2 save
pm2 startup

# 8. Setup SSL (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votingonline2025.site -d www.votingonline2025.site --non-interactive --agree-tos --email admin@votingonline2025.site || echo "SSL setup manual required"

echo ""
echo "✅ DEPLOYMENT COMPLETED!"
echo "========================"
echo "🏠 User Interface: https://votingonline2025.site"
echo "⚙️ Admin Panel: https://votingonline2025.site/admin"
echo "🔌 API: https://votingonline2025.site/api/"
echo ""
echo "🔐 Admin Login:"
echo "   URL: https://votingonline2025.site/admin"
echo "   User: admin"
echo "   Pass: AdminVoting2025@Secure!"
echo ""
echo "✅ New routing structure active!"