# 🚀 QUICK START GUIDE - BVOTE 2025

## ⚡ **KHỞI CHẠY NHANH - 1 LỆNH DUY NHẤT:**

### **🖱️ Windows - Double Click:**
```
📁 D:\Huse-User\
└── start-all-services.bat  ← Double click this file!
```

### **⌨️ Command Line:**
```bash
# From project root:
start-all-services.bat
```

---

## 🎯 **SAU KHI CHẠY SCRIPT:**

### **📊 Tự động khởi chạy:**
- ✅ **Backend API** trên `http://localhost:3000`
- ✅ **Admin Panel** trên `http://localhost:5173`
- ✅ **User Interface** trên `http://localhost:5174`

### **🌐 Tự động mở trình duyệt:**
- Admin Panel: http://localhost:5173
- User Interface: http://localhost:5174
- Backend Health: http://localhost:3000/health

---

## 🔧 **MANUAL START (Nếu cần):**

### **Backend API:**
```bash
cd backend
node server.js
```

### **Admin Panel:**
```bash
cd admin
npm run dev
```

### **User Interface:**
```bash
cd user
npm run dev
```

---

## 📊 **KIỂM TRA TRẠNG THÁI:**

### **Backend Health Check:**
```bash
curl http://localhost:3000/health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "BVOTE Backend is running!",
  "timestamp": "2025-09-25T04:25:34.443Z",
  "version": "2.0.0",
  "status": "healthy"
}
```

### **Frontend Status:**
- **Admin**: Truy cập http://localhost:5173 → Should show admin login
- **User**: Truy cập http://localhost:5174 → Should show user interface

---

## 🌐 **PRODUCTION DEPLOYMENT:**

### **Current Status:**
- ✅ **Configured**: All domains point to `votingonline2025.site`
- ✅ **Built**: Production builds ready
- ✅ **VPS Script**: `vps-deploy-complete.sh` prepared

### **Deploy to VPS:**
```bash
# Copy script to VPS:
scp vps-deploy-complete.sh root@YOUR_VPS_IP:/root/

# SSH and run:
ssh root@YOUR_VPS_IP
chmod +x /root/vps-deploy-complete.sh
bash /root/vps-deploy-complete.sh
```

### **Production URLs:**
- **User**: https://votingonline2025.site
- **Admin**: https://admin.votingonline2025.site
- **API**: https://api.votingonline2025.site

---

## 🛠️ **TROUBLESHOOTING:**

### **❌ Backend not starting:**
```bash
# Check if port 3000 is in use:
netstat -an | findstr :3000

# Kill process if needed:
taskkill /f /im node.exe

# Restart:
cd backend && node server.js
```

### **❌ Frontend build errors:**
```bash
# Clear cache and reinstall:
cd admin
rm -rf node_modules package-lock.json
npm install
npm run build

# Same for user:
cd ../user
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **❌ Port conflicts:**
- **Admin** usually runs on 5173, might auto-switch to 5174
- **User** usually runs on 5174, might auto-switch to 5175
- Check console output for actual ports

---

## 📋 **DEVELOPMENT WORKFLOW:**

### **Daily Development:**
1. **Start**: Run `start-all-services.bat`
2. **Code**: Edit files in `admin/src/` or `user/src/`
3. **Test**: Changes auto-reload in browser
4. **Build**: `npm run build` when ready for production

### **Before Deployment:**
1. **Test locally**: All services working
2. **Build production**: Both admin and user
3. **Test builds**: Serve dist folders locally
4. **Deploy**: Run VPS script or Netlify deploy

---

## 🎊 **READY TO USE:**

**BVOTE 2025 is now configured and ready for:**
- ✅ **Local Development** - All services running
- ✅ **Production Deployment** - VPS script ready
- ✅ **Unified Domain** - No CORS issues
- ✅ **Professional URLs** - votingonline2025.site

**Happy Coding! 🎉**
