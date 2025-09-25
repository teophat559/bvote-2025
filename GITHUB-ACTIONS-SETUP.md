# 🚀 GitHub Actions Auto Deployment Setup

## 🔐 **SETUP GITHUB SECRETS:**

### **Bước 1: Truy cập GitHub Repository Settings**
1. Vào repository: https://github.com/teophat559/bvote-2025
2. Click **Settings** tab
3. Trong sidebar trái, click **Secrets and variables** → **Actions**

### **Bước 2: Thêm Server Password Secret**
1. Click **New repository secret**
2. **Name**: `SERVER_PASSWORD`
3. **Value**: `123123zz@`
4. Click **Add secret**

---

## 🔧 **ALTERNATIVE: SSH KEY SETUP (KHUYẾN NGHỊ)**

### **Bước 1: Tạo SSH Key Pair**
```bash
# Trên máy local hoặc server
ssh-keygen -t rsa -b 4096 -C "github-actions@votingonline2025.site"
# Lưu tại: ~/.ssh/github_actions_key
```

### **Bước 2: Copy Public Key lên Server**
```bash
# Copy public key
cat ~/.ssh/github_actions_key.pub

# SSH vào server và thêm vào authorized_keys
ssh root@85.31.224.8
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### **Bước 3: Thêm Private Key vào GitHub Secrets**
1. Copy private key: `cat ~/.ssh/github_actions_key`
2. Vào GitHub repository → Settings → Secrets
3. **New secret**:
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: Paste toàn bộ private key (bao gồm `-----BEGIN...` và `-----END...`)

---

## 🚀 **AUTO DEPLOYMENT WORKFLOWS:**

### **📄 Workflow 1: Password-based (.github/workflows/simple-deploy.yml)**
- ✅ Sử dụng password authentication
- ✅ Không cần setup SSH keys
- ✅ Chỉ cần thêm `SERVER_PASSWORD` secret
- ✅ Tự động deploy khi push lên main branch

### **📄 Workflow 2: SSH Key-based (.github/workflows/deploy.yml)**
- ✅ Bảo mật hơn với SSH keys
- ✅ Cần setup SSH key pair
- ✅ Thêm `SSH_PRIVATE_KEY` secret
- ✅ Professional deployment approach

---

## 🎯 **CÁCH SỬ DỤNG:**

### **🔥 Method 1: Automatic (Khuyến nghị)**
1. **Setup secrets** (như hướng dẫn trên)
2. **Push code** lên main branch:
   ```bash
   git add .
   git commit -m "Update deployment"
   git push origin main
   ```
3. **GitHub Actions** sẽ tự động deploy!

### **⚡ Method 2: Manual Trigger**
1. Vào GitHub repository
2. Click **Actions** tab
3. Select workflow **"Deploy BVOTE 2025 to Server"**
4. Click **"Run workflow"**
5. Click **"Run workflow"** button

---

## 📊 **MONITORING DEPLOYMENT:**

### **🔍 Xem deployment progress:**
1. Vào **Actions** tab trên GitHub
2. Click vào workflow run đang chạy
3. Xem real-time logs

### **✅ Verify deployment:**
- Check GitHub Actions logs
- Test URLs:
  - https://votingonline2025.site
  - https://admin.votingonline2025.site
  - https://api.votingonline2025.site/health

---

## 🛠️ **TROUBLESHOOTING:**

### **❌ "ssh-private-key argument is empty"**
**Solution**: Thêm `SERVER_PASSWORD` secret hoặc `SSH_PRIVATE_KEY` secret

### **❌ "Permission denied (publickey,password)"**
**Solutions**:
1. Kiểm tra password trong secret
2. Hoặc setup SSH key đúng cách
3. Hoặc enable password authentication trên server:
   ```bash
   # Trên server
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication yes
   sudo systemctl restart ssh
   ```

### **❌ Deployment script fails**
**Solutions**:
1. Check server disk space: `df -h`
2. Check server memory: `free -h`
3. Manual deployment: SSH vào server và chạy script thủ công

---

## 🎊 **EXPECTED RESULT:**

### **✅ Sau khi GitHub Actions chạy thành công:**
1. ✅ **Code updated** trên server
2. ✅ **Dependencies installed**
3. ✅ **Backend restarted** với PM2
4. ✅ **Health check passed**
5. ✅ **URLs working**:
   - https://votingonline2025.site
   - https://admin.votingonline2025.site
   - https://api.votingonline2025.site

---

## 🚀 **QUICK SETUP:**

### **1-minute setup:**
```bash
# 1. Thêm server password secret
# GitHub → Settings → Secrets → New secret
# Name: SERVER_PASSWORD
# Value: 123123zz@

# 2. Push để trigger deployment
git add .
git commit -m "Enable auto deployment"
git push origin main

# 3. Watch deployment tại GitHub Actions tab
```

**🎉 GITHUB ACTIONS SẼ TỰ ĐỘNG DEPLOY MỖI KHI BẠN PUSH CODE! 🎉**
