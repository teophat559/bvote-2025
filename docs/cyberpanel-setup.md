# 🚀 CyberPanel Setup Guide - Default Template

Complete guide for deploying the Voting System on CyberPanel with OpenLiteSpeed.

## 📋 Prerequisites

- CyberPanel installed and running
- Domain name configured
- SSH access to server
- Basic Linux knowledge

## 🔧 Step-by-Step Setup

### 1. Domain Configuration

**In CyberPanel:**
1. Login to CyberPanel: `https://your-server-ip:8090`
2. Go to **Websites → Create Website**
3. Enter domain: `your-domain.com`
4. Select PHP version: `PHP 8.1` (will be changed to Node.js later)
5. Click **Create Website**

### 2. SSL Certificate

**Enable SSL:**
1. Go to **SSL → Manage SSL**
2. Select your domain
3. Click **Issue SSL**
4. Choose **Let's Encrypt**
5. Wait for SSL installation

### 3. Database Setup

**Create Database:**
1. Go to **Databases → Create Database**
2. Database Name: `voting_system_db`
3. Username: `voting_user`
4. Password: Generate strong password
5. Click **Create Database**

**Import Database:**
1. Go to **Databases → phpMyAdmin**
2. Select `voting_system_db`
3. Go to **Import** tab
4. Upload `database-setup.default.sql`
5. Click **Go**

### 4. File Upload

**Upload Application Files:**
1. Use **File Manager** or **SFTP**
2. Navigate to `/home/your-domain.com/public_html/`
3. Upload all application files:
   - `backend/` folder
   - `admin/dist/` content
   - `user/dist/` content
   - `server-production.default.js`
   - `config.production.default.env`
   - `.htaccess.template` → rename to `.htaccess`

### 5. Node.js Configuration

**Setup Node.js Selector:**
1. Go to **Node.js → Node.js Selector**
2. Select your domain: `your-domain.com`
3. Set Node.js version: `18.x` or higher
4. Set startup file: `server-production.default.js`
5. Set application port: `3000`
6. Click **Setup**

**Install Dependencies:**
1. In Node.js Selector, click **Run NPM Install**
2. Or via SSH:
   ```bash
   cd /home/your-domain.com/public_html
   npm install --production
   ```

### 6. Environment Configuration

**Setup .env file:**
1. Copy `config.production.default.env` to `.env`
2. Edit `.env` file:
   ```env
   NODE_ENV=production
   PORT=3000

   # Database (use values from step 3)
   DB_HOST=localhost
   DB_USER=voting_user
   DB_PASSWORD=your_generated_password
   DB_NAME=voting_system_db

   # Security
   JWT_SECRET=generate-super-secure-secret-key-here

   # Domain
   CORS_ORIGIN=https://your-domain.com
   ```

### 7. File Permissions

**Set Proper Permissions:**
```bash
# Via SSH
cd /home/your-domain.com/public_html
chown -R your-domain.com:your-domain.com .
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
chmod 600 .env
```

### 8. OpenLiteSpeed Configuration

**Virtual Host Configuration:**
1. Go to **LiteSpeed → Virtual Hosts**
2. Select your domain
3. Go to **Script Handler** tab
4. Add new handler:
   - Suffixes: `js`
   - Type: `LiteSpeed SAPI`
   - Extra Headers: `X-Forwarded-Proto $scheme`

**Rewrite Rules (.htaccess):**
```apache
RewriteEngine On

# API Routes to Node.js
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Admin Panel
RewriteCond %{HTTP_HOST} ^admin\.your-domain\.com$ [NC]
RewriteRule ^(.*)$ /admin/$1 [L]

# User App (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!admin/).*$ /index.html [L]
```

### 9. Start Application

**Via Node.js Selector:**
1. In CyberPanel → Node.js Selector
2. Select your domain
3. Click **Start Application**

**Via PM2 (Alternative):**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.default.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 10. Firewall Configuration

**Open Required Ports:**
```bash
# CyberPanel firewall
cyberpanel firewall allow 3000
cyberpanel firewall allow 80
cyberpanel firewall allow 443

# Or via CSF
csf -a 3000
```

## ✅ Testing

### Health Check
1. Visit: `https://your-domain.com/api/health`
2. Should return JSON with status "OK"

### Admin Panel
1. Visit: `https://admin.your-domain.com`
2. Login with default credentials:
   - Email: `admin@your-domain.com`
   - Password: `your-secure-password`

### User Interface
1. Visit: `https://your-domain.com`
2. Should display voting interface

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check Node.js logs
tail -f /home/your-domain.com/logs/nodejs.log

# Check application logs
tail -f /home/your-domain.com/public_html/logs/error.log

# Restart application
cyberpanel restartApp your-domain.com
```

### Database Connection Issues
1. Verify database credentials in `.env`
2. Test connection:
   ```bash
   mysql -u voting_user -p voting_system_db
   ```
3. Check MySQL service:
   ```bash
   systemctl status mysql
   ```

### 502 Bad Gateway
1. Check if Node.js app is running on port 3000:
   ```bash
   netstat -tulpn | grep :3000
   ```
2. Restart OpenLiteSpeed:
   ```bash
   systemctl restart lsws
   ```

### Permission Errors
```bash
# Fix ownership
chown -R your-domain.com:your-domain.com /home/your-domain.com/public_html

# Fix permissions
chmod -R 755 /home/your-domain.com/public_html
chmod 600 /home/your-domain.com/public_html/.env
```

## 📊 Monitoring

### Application Logs
- Location: `/home/your-domain.com/public_html/logs/`
- View: `tail -f logs/combined.log`

### OpenLiteSpeed Logs
- Location: `/usr/local/lsws/logs/`
- Error log: `error.log`
- Access log: `access.log`

### Performance Monitoring
```bash
# Check resource usage
htop

# Monitor application
pm2 monit

# Check disk space
df -h
```

## 🔄 Updates & Maintenance

### Application Updates
1. Stop application
2. Backup current version
3. Upload new files
4. Update dependencies: `npm install --production`
5. Restart application

### Database Backup
```bash
# Create backup
mysqldump -u voting_user -p voting_system_db > backup.sql

# Restore backup
mysql -u voting_user -p voting_system_db < backup.sql
```

### Security Updates
1. Regular OS updates: `yum update` or `apt update`
2. Keep CyberPanel updated
3. Monitor security logs
4. Update Node.js dependencies

## 📞 Support

### CyberPanel Resources
- [Documentation](https://cyberpanel.net/docs/)
- [Community Forum](https://community.cyberpanel.net/)
- [GitHub Issues](https://github.com/usmannasir/cyberpanel/issues)

### Application Support
- Check logs first
- Search GitHub issues
- Contact support: your-email@domain.com

---

🎉 **Congratulations!** Your voting system is now running on CyberPanel with OpenLiteSpeed.
