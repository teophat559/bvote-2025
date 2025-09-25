# 🚀 BVOTE 2025 - Server Connection & Deployment Guide

## 📋 **SERVER INFORMATION:**
- **Domain**: votingonline2025.site
- **Server IP**: 85.31.224.8
- **Username**: root
- **Password**: 123123zz@
- **Web Root**: /home/votingonline2025.site/public_html

---

## 🔐 **CONNECT TO SERVER:**

### **Method 1: SSH (Recommended)**
```bash
ssh root@85.31.224.8
# Enter password: 123123zz@
```

### **Method 2: PuTTY (Windows)**
- Host: 85.31.224.8
- Port: 22
- Username: root
- Password: 123123zz@

---

## 🚀 **AUTO DEPLOYMENT (RECOMMENDED):**

### **Step 1: Connect to server**
```bash
ssh root@85.31.224.8
```

### **Step 2: Download and run deployment script**
```bash
wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh
chmod +x deploy-votingonline2025.sh
./deploy-votingonline2025.sh
```

### **Step 3: Wait for completion**
The script will automatically:
- ✅ Install Node.js, npm, git, nginx
- ✅ Clone repository from GitHub
- ✅ Install all dependencies
- ✅ Configure environment
- ✅ Setup database
- ✅ Configure nginx
- ✅ Start backend with PM2
- ✅ Setup SSL certificates
- ✅ Configure domain routing

---

## 🌐 **EXPECTED URLS AFTER DEPLOYMENT:**

### **🔗 Your Live URLs:**
- **Main Site**: https://votingonline2025.site
- **Admin Panel**: https://admin.votingonline2025.site
- **API Backend**: https://api.votingonline2025.site
- **Health Check**: https://api.votingonline2025.site/health

### **🔄 URL Routing:**
- `votingonline2025.site` → Redirects to Netlify User Interface
- `admin.votingonline2025.site` → Redirects to Netlify Admin Panel
- `api.votingonline2025.site` → Your server backend (Port 3000)

---

## ⚡ **QUICK MANUAL DEPLOYMENT (Alternative):**

### **If you prefer manual steps:**
```bash
# 1. Connect to server
ssh root@85.31.224.8

# 2. Navigate to web directory
cd /home/votingonline2025.site/public_html

# 3. Clone repository
git clone https://github.com/teophat559/bvote-2025.git temp
cp -r temp/backend/ ./backend/
rm -rf temp/

# 4. Install dependencies
cd backend/
npm install --production

# 5. Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DOMAIN=votingonline2025.site
API_URL=https://api.votingonline2025.site
FRONTEND_URL=https://votingonline2025.site
ADMIN_URL=https://admin.votingonline2025.site
CORS_ORIGIN=https://votingonline2025.site,https://admin.votingonline2025.site,https://api.votingonline2025.site
CORS_CREDENTIALS=true
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
ENABLE_TELEGRAM_NOTIFICATIONS=true
EOF

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name bvote-backend
pm2 startup
pm2 save
```

---

## 🔧 **VERIFICATION COMMANDS:**

### **After deployment, check:**
```bash
# Check backend status
pm2 status

# Check if port 3000 is listening
netstat -tlnp | grep :3000

# Test API locally
curl http://localhost:3000/health

# Test API via domain (after SSL setup)
curl https://api.votingonline2025.site/health

# Check nginx status
systemctl status nginx

# View backend logs
pm2 logs bvote-backend
```

---

## 🛠️ **TROUBLESHOOTING:**

### **If deployment fails:**
```bash
# Check system resources
df -h
free -h

# Check if Node.js is installed
node --version
npm --version

# Manual dependency installation
cd /home/votingonline2025.site/public_html/backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production

# Manual server start
killall node
cd /home/votingonline2025.site/public_html/backend
node server.js
```

### **If SSL setup fails:**
```bash
# Install certbot manually
apt update
apt install certbot python3-certbot-nginx

# Get SSL certificates
certbot --nginx -d api.votingonline2025.site -d admin.votingonline2025.site -d votingonline2025.site -d www.votingonline2025.site
```

---

## 📊 **EXPECTED DEPLOYMENT RESULT:**

### **✅ After successful deployment:**
1. **Backend API** running on port 3000
2. **PM2** managing the Node.js process
3. **Nginx** configured with SSL certificates
4. **Domain routing** working correctly:
   - Main site → Netlify user interface
   - Admin → Netlify admin panel
   - API → Your server backend
5. **Health checks** responding
6. **Telegram notifications** active

### **🌐 Test URLs:**
- https://votingonline2025.site (should redirect to Netlify)
- https://admin.votingonline2025.site (should redirect to Netlify)
- https://api.votingonline2025.site/health (should return JSON status)

---

## 🎯 **FINAL CHECKLIST:**

### **✅ Verify these work:**
- [ ] SSH connection to server
- [ ] Backend deployment script runs without errors
- [ ] PM2 shows bvote-backend as online
- [ ] Port 3000 is listening
- [ ] API health check returns JSON
- [ ] SSL certificates are installed
- [ ] Domain redirects work correctly
- [ ] Telegram notifications are sent

### **📱 Contact & Support:**
- **GitHub**: https://github.com/teophat559/bvote-2025
- **Issues**: Create issue on GitHub if problems occur
- **Logs**: Check `/home/votingonline2025.site/public_html/logs/`

---

## 🎉 **READY TO DEPLOY:**

**Run this single command on your server:**
```bash
wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh
```

**🚀 This will fully deploy BVOTE 2025 to your votingonline2025.site domain!**
