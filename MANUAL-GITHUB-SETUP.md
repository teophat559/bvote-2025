# 🔐 MANUAL GITHUB SETUP - BVOTE 2025

## 🚀 **BƯỚC CÒN LẠI ĐỂ HOÀN THÀNH AUTO DEPLOYMENT:**

### **📋 Bước 1: Thêm GitHub Secret (2 phút)**

#### **🔗 Truy cập GitHub Settings:**
1. Vào: https://github.com/teophat559/bvote-2025/settings/secrets/actions
2. Click **"New repository secret"**

#### **🔐 Thêm Secret:**
- **Name**: `SERVER_PASSWORD`
- **Value**: `123123zz@`
- Click **"Add secret"**

### **📋 Bước 2: Trigger Deployment**

#### **🚀 Method 1: Auto Deploy (Push code)**
```bash
# Từ thư mục D:\Huse-User
git add .
git commit -m "Trigger auto deployment"
git push origin main
```

#### **⚡ Method 2: Manual Trigger**
1. Vào: https://github.com/teophat559/bvote-2025/actions
2. Click workflow **"Simple Deploy to votingonline2025.site"**
3. Click **"Run workflow"**
4. Click **"Run workflow"** button

---

## 📊 **MONITOR DEPLOYMENT:**

### **🔍 Xem tiến trình:**
1. Vào: https://github.com/teophat559/bvote-2025/actions
2. Click vào workflow run mới nhất
3. Xem real-time logs

### **⏱️ Thời gian deployment:**
- Khoảng 5-10 phút
- Tự động cài đặt dependencies
- Restart backend với PM2
- Verify health checks

---

## ✅ **KẾT QUẢ MONG ĐỢI:**

### **🌐 URLs sẽ hoạt động:**
- **Main Site**: https://votingonline2025.site
- **Admin Panel**: https://admin.votingonline2025.site
- **API Backend**: https://api.votingonline2025.site
- **Health Check**: https://api.votingonline2025.site/health

### **📊 GitHub Actions sẽ:**
- ✅ Connect to server 85.31.224.8
- ✅ Download deployment script
- ✅ Install/update backend
- ✅ Restart PM2 service
- ✅ Verify health check
- ✅ Report success/failure

---

## 🛠️ **TROUBLESHOOTING:**

### **❌ Nếu workflow fails:**
1. Check GitHub Actions logs
2. Verify SERVER_PASSWORD secret
3. Manual deployment:
   ```bash
   ssh root@85.31.224.8
   # Password: 123123zz@
   wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh
   chmod +x deploy-votingonline2025.sh
   ./deploy-votingonline2025.sh
   ```

### **✅ Nếu workflow succeeds:**
- Test all URLs
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs bvote-backend`

---

## 🎯 **NEXT STEPS:**

### **📋 Sau khi setup secret:**
1. **Push code** để trigger deployment
2. **Monitor** tại GitHub Actions
3. **Test URLs** sau khi complete
4. **Enjoy** auto deployment!

### **🔄 Future deployments:**
- Mỗi lần push code → Auto deploy
- Hoặc manual trigger từ GitHub Actions
- Monitoring và logs tự động

---

## 🎉 **FINAL CHECKLIST:**

### **✅ Cần hoàn thành:**
- [ ] Thêm `SERVER_PASSWORD` secret
- [ ] Trigger deployment (push hoặc manual)
- [ ] Monitor GitHub Actions logs
- [ ] Verify URLs hoạt động
- [ ] Test backend health check

### **🚀 URLs để test:**
- [ ] https://votingonline2025.site
- [ ] https://admin.votingonline2025.site
- [ ] https://api.votingonline2025.site/health

---

## ⚡ **QUICK ACTION:**

### **🔥 Làm ngay bây giờ:**
```
1. Vào: https://github.com/teophat559/bvote-2025/settings/secrets/actions
2. New secret: SERVER_PASSWORD = 123123zz@
3. Push code hoặc manual trigger
4. Monitor tại: https://github.com/teophat559/bvote-2025/actions
5. Test URLs sau khi complete
```

**🎊 CHỈ CÒN 1 BƯỚC NỮA LÀ HOÀN THÀNH AUTO DEPLOYMENT! 🎊**
