# 📋 PRODUCTION DEPLOYMENT CHECKLIST

## 🚀 **PRE-DEPLOYMENT**

### ✅ **Environment Setup**
- [ ] VPS server with Ubuntu 20.04+ or similar
- [ ] Domain name configured
- [ ] DNS records pointed to server IP
- [ ] SSH access configured
- [ ] Non-root user created

### ✅ **Dependencies Installed**
- [ ] Node.js 18+ installed
- [ ] NPM 9+ installed
- [ ] PM2 process manager
- [ ] Nginx web server
- [ ] MySQL database (optional)
- [ ] Git for version control

## 🌐 **DEPLOYMENT PROCESS**

### ✅ **Code Preparation**
- [ ] All changes committed to git
- [ ] Production branch created
- [ ] Dependencies updated
- [ ] Frontend apps built successfully
- [ ] Backend tested locally

### ✅ **Server Configuration**
- [ ] Application directory created
- [ ] File permissions set correctly
- [ ] Nginx configuration applied
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Firewall configured (ports 80, 443, 22)

### ✅ **Application Deployment**
- [ ] Backend deployed and running
- [ ] Frontend apps built and served
- [ ] PM2 process started
- [ ] Database connected (if using)
- [ ] API endpoints responding

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### ✅ **Health Checks**
- [ ] Main app loads: `https://yourdomain.com`
- [ ] Admin panel loads: `https://admin.yourdomain.com`
- [ ] API health check: `https://yourdomain.com/api/health`
- [ ] All pages render correctly
- [ ] No console errors

### ✅ **Performance Tests**
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] SSL certificate valid

### ✅ **Monitoring Setup**
- [ ] PM2 monitoring configured
- [ ] Log rotation set up
- [ ] Error tracking implemented
- [ ] Backup strategy in place
- [ ] Update procedure documented

## ⚡ **OPTIMIZATION**

### ✅ **Performance**
- [ ] Gzip compression enabled
- [ ] Static asset caching
- [ ] CDN configured (optional)
- [ ] Database optimized
- [ ] Memory usage monitored

### ✅ **Security**
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Security headers set

## 🛠️ **MAINTENANCE**

### ✅ **Regular Tasks**
- [ ] Daily backup verification
- [ ] Weekly log review
- [ ] Monthly dependency updates
- [ ] Quarterly security audit
- [ ] Performance monitoring

### ✅ **Emergency Procedures**
- [ ] Rollback procedure tested
- [ ] Emergency contacts defined
- [ ] Incident response plan
- [ ] Recovery time objectives set
- [ ] Data recovery procedures

## 📈 **SCALING CONSIDERATIONS**

### ✅ **When to Scale**
- [ ] CPU usage > 80% consistently
- [ ] Memory usage > 85% consistently
- [ ] Response times > 1 second
- [ ] Error rates > 1%
- [ ] User complaints about performance

### ✅ **Scaling Options**
- [ ] Vertical scaling (more CPU/RAM)
- [ ] Horizontal scaling (multiple servers)
- [ ] Load balancer implementation
- [ ] Database clustering
- [ ] CDN integration

---

## 🎯 **DEPLOYMENT COMMANDS**

```bash
# Quick deployment
bash scripts/deploy-vps.sh

# Manual deployment
npm run build
npm run start:pm2

# Health check
npm run health

# Restart services
npm run restart:pm2
sudo systemctl reload nginx
```

## 📞 **SUPPORT**

For deployment issues or questions:
- Check logs: `pm2 logs bvote`
- Monitor status: `pm2 status`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
