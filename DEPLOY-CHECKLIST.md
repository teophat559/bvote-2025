# ✅ CHECKLIST DEPLOY VOTINGONLINE2025.SITE

## 🎯 **TỔNG QUAN**
- **Domain**: votingonline2025.site
- **VPS**: 85.31.224.8 (root/123123zz@)
- **CyberPanel**: admin/123123zz#Bong
- **Phương pháp**: Frontend Netlify + Backend VPS

---

## 📋 **CHECKLIST TỪNG BƯỚC**

### **BƯỚC 1: Chuẩn bị môi trường** ✅
- [x] Phân tích cấu trúc dự án
- [x] Tạo cấu hình production (loại bỏ localhost)
- [x] Setup GitHub Actions workflow
- [x] Tạo scripts deployment

### **BƯỚC 2: GitHub Repository Setup** 🔄
- [ ] **Tạo GitHub repository**
  ```bash
  # Chạy script setup
  scripts/setup-github-repo.bat
  ```
- [ ] **Tạo repository trên GitHub.com**
  - Repository name: `voting-system-2025`
  - Description: `BVOTE 2025 - Voting System for votingonline2025.site`
- [ ] **Connect local với GitHub**
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/voting-system-2025.git
  git branch -M main
  git push -u origin main
  ```

### **BƯỚC 3: Netlify Setup** 🔄
- [ ] **Tạo Netlify account** → [netlify.com](https://netlify.com)
- [ ] **Tạo 2 sites:**
  - Site 1: User Frontend → `votingonline2025.site`
  - Site 2: Admin Frontend → `admin.votingonline2025.site`
- [ ] **Lưu Site IDs** từ Site Settings
- [ ] **Install Netlify CLI**
  ```bash
  npm install -g netlify-cli
  netlify login
  ```

### **BƯỚC 4: GitHub Secrets Setup** 🔄
Repository Settings → Secrets and variables → Actions:
- [ ] `NETLIFY_AUTH_TOKEN` = your_netlify_token
- [ ] `NETLIFY_USER_SITE_ID` = your_user_site_id
- [ ] `NETLIFY_ADMIN_SITE_ID` = your_admin_site_id
- [ ] `VPS_SSH_PRIVATE_KEY` = your_ssh_private_key

### **BƯỚC 5: VPS Setup** 🔄
- [ ] **Upload script lên VPS**
  ```bash
  scp deployment/vps-setup-votingonline2025.sh root@85.31.224.8:/tmp/
  ```
- [ ] **Chạy setup script**
  ```bash
  ssh root@85.31.224.8 "bash /tmp/vps-setup-votingonline2025.sh"
  ```
- [ ] **Kiểm tra services**
  ```bash
  ssh root@85.31.224.8 "systemctl status postgresql nginx"
  ```

### **BƯỚC 6: Database Setup** 🔄
- [ ] **Upload database script**
  ```bash
  scp deployment/database-production-setup.sql root@85.31.224.8:/tmp/
  ```
- [ ] **Chạy database setup**
  ```bash
  ssh root@85.31.224.8 "su - postgres -c 'psql -f /tmp/database-production-setup.sql'"
  ```

### **BƯỚC 7: DNS Configuration** 🔄
Trong DNS provider, thêm A records:
- [ ] `votingonline2025.site` → `85.31.224.8`
- [ ] `admin.votingonline2025.site` → `85.31.224.8`
- [ ] `api.votingonline2025.site` → `85.31.224.8`

### **BƯỚC 8: SSL Certificates** 🔄
CyberPanel (https://85.31.224.8:8090):
- [ ] Login: admin/123123zz#Bong
- [ ] SSL → Issue SSL
- [ ] Domain: `votingonline2025.site`
- [ ] Add all subdomains
- [ ] Issue Let's Encrypt certificate

### **BƯỚC 9: Switch to Production** 🔄
- [ ] **Chạy script chuyển đổi**
  ```bash
  bash scripts/switch-to-production.sh
  ```
- [ ] **Verify configs đã được update**

### **BƯỚC 10: Deploy** 🔄
- [ ] **Quick build test**
  ```bash
  scripts/quick-deploy.bat
  ```
- [ ] **Full deployment**
  ```bash
  bash scripts/deploy-production.sh
  ```
- [ ] **Hoặc push để GitHub Actions tự deploy**
  ```bash
  git add .
  git commit -m "🚀 Deploy to production"
  git push origin main
  ```

---

## 🔍 **VERIFICATION CHECKLIST**

### **Health Checks** 🔄
- [ ] User Frontend: `https://votingonline2025.site`
- [ ] Admin Frontend: `https://admin.votingonline2025.site`
- [ ] Backend API: `https://api.votingonline2025.site/api/health`

### **Functionality Tests** 🔄
- [ ] User registration works
- [ ] Admin login works (admin@votingonline2025.site / admin123)
- [ ] Voting system functional
- [ ] Database connections working
- [ ] WebSocket connections working

### **Performance Tests** 🔄
- [ ] Page load times < 3s
- [ ] API response times < 1s
- [ ] No console errors
- [ ] Mobile responsive

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
- **Frontend không load**: Check DNS propagation, SSL certificates
- **Backend API lỗi**: Check PM2 status, database connection
- **Build failures**: Check Node.js version, dependencies

### **Useful Commands**
```bash
# Check PM2 status
ssh root@85.31.224.8 "pm2 status"

# View logs
ssh root@85.31.224.8 "pm2 logs voting-api"

# Restart services
ssh root@85.31.224.8 "pm2 restart voting-api"

# Check database
ssh root@85.31.224.8 "su - postgres -c 'psql voting_production_2025 -c \"SELECT COUNT(*) FROM users;\"'"
```

---

## 🎉 **COMPLETION**

### **Success Criteria** ✅
- [ ] All 3 URLs accessible with HTTPS
- [ ] User can register and vote
- [ ] Admin panel fully functional
- [ ] No critical errors in logs
- [ ] Performance meets requirements

### **Final URLs**
- **User Site**: https://votingonline2025.site
- **Admin Panel**: https://admin.votingonline2025.site
- **Backend API**: https://api.votingonline2025.site
- **CyberPanel**: https://85.31.224.8:8090

### **Default Credentials**
- **Admin**: admin@votingonline2025.site / admin123
- **Database**: voting_user / VotingSec2025!
- **VPS**: root / 123123zz@

> ⚠️ **LƯU Ý**: Đổi tất cả passwords sau khi deploy thành công!
