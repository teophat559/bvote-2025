# 🚀 HƯỚNG DẪN GITHUB + NETLIFY DEPLOYMENT

## 🎯 **BƯỚC 1: CÀI ĐẶT GIT (NẾU CHƯA CÓ)**

### **Download và cài đặt Git:**
1. Truy cập: https://git-scm.com/download/win
2. Download Git for Windows
3. Cài đặt với các tùy chọn mặc định
4. Restart Command Prompt

### **Cấu hình Git (lần đầu):**
```cmd
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🎯 **BƯỚC 2: TẠO GITHUB REPOSITORY**

### **Trên GitHub.com:**
1. 🌐 Truy cập: https://github.com/new
2. 📝 **Repository name**: `voting-system-2025`
3. 📄 **Description**: `BVOTE 2025 - Voting System for votingonline2025.site`
4. 🔓 **Visibility**: Public (hoặc Private nếu muốn)
5. ❌ **KHÔNG** check "Add a README file"
6. ❌ **KHÔNG** check "Add .gitignore"
7. ❌ **KHÔNG** check "Choose a license"
8. 🚀 Click **"Create repository"**

### **Lưu lại URL repository:**
```
https://github.com/YOUR_USERNAME/voting-system-2025.git
```

---

## 🎯 **BƯỚC 3: PUSH CODE LÊN GITHUB**

### **Trong Command Prompt (D:\Huse-User):**

```cmd
# Kiểm tra Git đã cài đặt
git --version

# Khởi tạo repository (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit với message
git commit -m "🚀 Initial deployment for votingonline2025.site"

# Thêm remote origin (thay YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/voting-system-2025.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

---

## 🎯 **BƯỚC 4: TẠO NETLIFY SITES**

### **4.1. Tạo Netlify Account:**
1. 🌐 Truy cập: https://netlify.com
2. 📝 Sign up với GitHub account (khuyến nghị)
3. ✅ Verify email

### **4.2. Tạo User Frontend Site:**
1. 🚀 Click **"New site from Git"**
2. 🔗 Chọn **"GitHub"**
3. 🔍 Tìm và chọn repository `voting-system-2025`
4. ⚙️ **Build settings:**
   - **Base directory**: `user`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `user/dist`
5. 🌐 **Environment variables**:
   ```
   VITE_APP_ENV=production
   VITE_USE_MOCK=0
   VITE_API_URL=https://api.votingonline2025.site/api
   VITE_SOCKET_URL=https://api.votingonline2025.site
   VITE_BASE_URL=https://votingonline2025.site
   ```
6. 🚀 Click **"Deploy site"**
7. 📝 **Lưu Site ID** từ Site Settings

### **4.3. Tạo Admin Frontend Site:**
1. 🚀 Click **"New site from Git"** (lần 2)
2. 🔗 Chọn **"GitHub"** và repository `voting-system-2025`
3. ⚙️ **Build settings:**
   - **Base directory**: `admin`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `admin/dist`
4. 🌐 **Environment variables**:
   ```
   VITE_APP_ENV=production
   VITE_USE_MOCK=0
   VITE_API_URL=https://api.votingonline2025.site/api
   VITE_SOCKET_URL=https://api.votingonline2025.site
   VITE_BASE_URL=https://admin.votingonline2025.site
   ```
5. 🚀 Click **"Deploy site"**
6. 📝 **Lưu Site ID** từ Site Settings

---

## 🎯 **BƯỚC 5: CÀI ĐẶT CUSTOM DOMAINS**

### **5.1. User Site Domain:**
1. 🌐 Vào User site → **Site settings** → **Domain management**
2. 🔗 Click **"Add custom domain"**
3. 📝 Nhập: `votingonline2025.site`
4. ✅ Confirm

### **5.2. Admin Site Domain:**
1. 🌐 Vào Admin site → **Site settings** → **Domain management**
2. 🔗 Click **"Add custom domain"**
3. 📝 Nhập: `admin.votingonline2025.site`
4. ✅ Confirm

---

## 🎯 **BƯỚC 6: CẤU HÌNH DNS**

### **Trong DNS Provider của bạn:**
```
Type  Name                          Value
A     votingonline2025.site         85.31.224.8
A     admin.votingonline2025.site   85.31.224.8
A     api.votingonline2025.site     85.31.224.8

# Hoặc nếu muốn dùng Netlify cho frontend:
CNAME votingonline2025.site         your-user-site.netlify.app
CNAME admin.votingonline2025.site   your-admin-site.netlify.app
A     api.votingonline2025.site     85.31.224.8
```

---

## 🎯 **BƯỚC 7: SETUP GITHUB ACTIONS (TỰ ĐỘNG)**

### **File đã tạo sẵn:** `.github/workflows/deploy-netlify.yml`

### **GitHub Secrets cần thêm:**
Repository → Settings → Secrets and variables → Actions:

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_USER_SITE_ID=your_user_site_id
NETLIFY_ADMIN_SITE_ID=your_admin_site_id
VPS_SSH_PRIVATE_KEY=your_ssh_private_key
```

### **Lấy Netlify Auth Token:**
1. 🌐 Netlify → User settings → Applications
2. 🔑 Personal access tokens → **New access token**
3. 📝 Name: `GitHub Actions Deploy`
4. 📋 Copy token và lưu vào GitHub Secrets

---

## 🎯 **BƯỚC 8: VPS BACKEND SETUP**

### **Upload và chạy VPS setup:**
```bash
# Upload script
scp scripts/vps-auto-setup.sh root@85.31.224.8:/tmp/

# Run setup
ssh root@85.31.224.8 "bash /tmp/vps-auto-setup.sh"
```

---

## 🎯 **BƯỚC 9: TEST DEPLOYMENT**

### **Push để trigger auto-deploy:**
```cmd
git add .
git commit -m "🚀 Configure GitHub + Netlify deployment"
git push origin main
```

### **Kiểm tra GitHub Actions:**
1. 🌐 GitHub repository → **Actions** tab
2. 👀 Theo dõi workflow `Deploy to Netlify + VPS`
3. ✅ Đảm bảo tất cả jobs thành công

---

## 🎯 **BƯỚC 10: VERIFY DEPLOYMENT**

### **Kiểm tra các URLs:**
- 👥 **User**: https://votingonline2025.site
- 👨‍💼 **Admin**: https://admin.votingonline2025.site
- 🔧 **API**: https://api.votingonline2025.site/api/health

### **Test functionality:**
- ✅ User registration
- ✅ Admin login (admin@votingonline2025.site / admin123)
- ✅ Voting system
- ✅ Real-time updates

---

## 🎉 **HOÀN THÀNH!**

### **🔗 Live URLs:**
- **User Site**: https://votingonline2025.site
- **Admin Panel**: https://admin.votingonline2025.site
- **Backend API**: https://api.votingonline2025.site

### **🔄 Workflow tự động:**
- Push code → GitHub Actions tự động deploy
- Frontend → Netlify CDN (global)
- Backend → VPS với PM2 (stable)

### **🔐 Security:**
- HTTPS enforced
- Environment variables secure
- Database isolated
- Admin panel protected

**🎯 Deployment thành công với GitHub + Netlify! 🚀**
