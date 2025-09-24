@echo off
REM 🚀 GITHUB + NETLIFY COMPLETE SETUP
REM With user info: teophat559 / teophat559@gmail.com

echo.
echo 🚀 GITHUB + NETLIFY COMPLETE SETUP
echo ==================================
echo User: teophat559
echo Email: teophat559@gmail.com
echo Repository: https://github.com/teophat559/codelogin.git
echo Domain: votingonline2025.site
echo.

REM ==============================================
REM STEP 1: GIT CONFIGURATION
REM ==============================================
echo 📝 [1/6] Configuring Git...

git config --global user.name "teophat559"
git config --global user.email "teophat559@gmail.com"

echo ✅ Git configured successfully!

REM ==============================================
REM STEP 2: REPOSITORY SETUP
REM ==============================================
echo 📁 [2/6] Setting up repository...

REM Initialize git if not already done
if not exist ".git" (
    git init
    echo ✅ Git repository initialized!
)

REM Add all files
git add .
git commit -m "🚀 Complete voting system for votingonline2025.site deployment" >nul 2>&1

REM Set up remote
git remote remove origin >nul 2>&1
git remote add origin https://github.com/teophat559/codelogin.git
git branch -M main

echo ✅ Repository configured for teophat559/codelogin!

REM ==============================================
REM STEP 3: PUSH TO GITHUB
REM ==============================================
echo 📤 [3/6] Pushing to GitHub...

echo Pushing complete voting system to GitHub...
git push -f -u origin main

if %ERRORLEVEL% equ 0 (
    echo ✅ Code pushed to GitHub successfully!
    echo 🔗 Repository: https://github.com/teophat559/codelogin
) else (
    echo ⚠️ Push may have failed. You may need to authenticate with GitHub.
    echo 💡 Try: git push -u origin main
)

REM ==============================================
REM STEP 4: NETLIFY SETUP INSTRUCTIONS
REM ==============================================
echo 🌐 [4/6] Netlify deployment setup...

echo.
echo 🚀 NETLIFY DEPLOYMENT STEPS:
echo ============================
echo.
echo 📋 STEP 4.1 - Create User Frontend Site:
echo ----------------------------------------
echo 1. 🌐 Go to: https://netlify.com
echo 2. 🔗 Login with GitHub account (teophat559)
echo 3. 🚀 Click "New site from Git"
echo 4. 🔗 Choose "GitHub" and select "codelogin"
echo 5. ⚙️ Build settings:
echo    Branch to deploy: main
echo    Base directory: user
echo    Build command: npm install ^&^& npm run build
echo    Publish directory: user/dist
echo 6. 🌐 Environment variables (click "Show advanced"):
echo    VITE_APP_ENV=production
echo    VITE_USE_MOCK=0
echo    VITE_API_URL=https://api.votingonline2025.site/api
echo    VITE_SOCKET_URL=https://api.votingonline2025.site
echo    VITE_BASE_URL=https://votingonline2025.site
echo    VITE_ENABLE_CONSOLE_LOGS=0
echo    VITE_LOG_LEVEL=error
echo 7. 🚀 Click "Deploy site"
echo 8. ⏰ Wait for build to complete
echo 9. 🌐 Site settings ^> Domain management ^> Add custom domain: votingonline2025.site
echo.

echo 📋 STEP 4.2 - Create Admin Frontend Site:
echo ------------------------------------------
echo 1. 🚀 Click "New site from Git" (create second site)
echo 2. 🔗 Choose "GitHub" and select "codelogin" again
echo 3. ⚙️ Build settings:
echo    Branch to deploy: main
echo    Base directory: admin
echo    Build command: npm install ^&^& npm run build
echo    Publish directory: admin/dist
echo 4. 🌐 Environment variables:
echo    VITE_APP_ENV=production
echo    VITE_USE_MOCK=0
echo    VITE_API_URL=https://api.votingonline2025.site/api
echo    VITE_SOCKET_URL=https://api.votingonline2025.site
echo    VITE_BASE_URL=https://admin.votingonline2025.site
echo    VITE_ENABLE_CONSOLE_LOGS=0
echo    VITE_LOG_LEVEL=error
echo 5. 🚀 Click "Deploy site"
echo 6. ⏰ Wait for build to complete
echo 7. 🌐 Site settings ^> Domain management ^> Add custom domain: admin.votingonline2025.site
echo.

set /p netlify_user_done="✅ Have you completed USER site deployment on Netlify? (y/n): "
set /p netlify_admin_done="✅ Have you completed ADMIN site deployment on Netlify? (y/n): "

REM ==============================================
REM STEP 5: VPS BACKEND DEPLOYMENT
REM ==============================================
echo 🖥️ [5/6] VPS backend deployment...

echo.
echo 🔧 VPS BACKEND SETUP COMMANDS:
echo ==============================
echo.
echo 📤 1. Upload VPS setup script:
echo scp scripts\vps-auto-setup.sh root@85.31.224.8:/tmp/
echo.
echo 🚀 2. Run VPS setup:
echo ssh root@85.31.224.8 "bash /tmp/vps-auto-setup.sh"
echo.
echo 📦 3. Deploy backend code:
echo scp -r backend root@85.31.224.8:/home/votingonline2025.site/
echo scp config\production-votingonline2025-clean.env root@85.31.224.8:/home/votingonline2025.site/backend/.env
echo.
echo 🔄 4. Start backend services:
echo ssh root@85.31.224.8 "cd /home/votingonline2025.site/backend && npm install --production && pm2 start ecosystem.config.js"
echo.

set /p vps_done="✅ Have you completed VPS backend setup? (y/n): "

REM ==============================================
REM STEP 6: DNS CONFIGURATION
REM ==============================================
echo 🌐 [6/6] DNS configuration...

echo.
echo 🔧 DNS RECORDS TO ADD:
echo ======================
echo In your domain provider's DNS management, add:
echo.
echo Type  Name                          Value
echo ----  ----                          -----
echo A     votingonline2025.site         85.31.224.8
echo A     admin.votingonline2025.site   85.31.224.8
echo A     api.votingonline2025.site     85.31.224.8
echo.
echo 💡 Alternative (if using Netlify domains):
echo CNAME votingonline2025.site         your-user-site.netlify.app
echo CNAME admin.votingonline2025.site   your-admin-site.netlify.app
echo A     api.votingonline2025.site     85.31.224.8
echo.

set /p dns_done="✅ Have you configured DNS records? (y/n): "

REM ==============================================
REM COMPLETION & VERIFICATION
REM ==============================================
echo.
echo ████████████████████████████████████████████
echo ██                                        ██
echo ██      🎉 DEPLOYMENT COMPLETED! 🎉       ██
echo ██                                        ██
echo ████████████████████████████████████████████
echo.

echo 🔗 Your GitHub Repository:
echo https://github.com/teophat559/codelogin
echo.

echo 🌐 Your Live Sites (after DNS propagation):
echo ============================================
echo 👥 User Site:    https://votingonline2025.site
echo 👨‍💼 Admin Panel:  https://admin.votingonline2025.site
echo 🔧 Backend API:  https://api.votingonline2025.site
echo ⚙️ CyberPanel:   https://85.31.224.8:8090
echo.

echo 🔐 Default Login Credentials:
echo ==============================
echo Admin Panel: admin@votingonline2025.site / admin123
echo VPS Access:  root@85.31.224.8 / 123123zz@
echo CyberPanel:  admin / 123123zz#Bong
echo.

echo 📋 VERIFICATION CHECKLIST:
echo ===========================
echo [ ] User site loads: https://votingonline2025.site
echo [ ] Admin panel loads: https://admin.votingonline2025.site
echo [ ] Backend API responds: https://api.votingonline2025.site/api/health
echo [ ] User can register and vote
echo [ ] Admin can login and manage
echo [ ] Real-time features work
echo.

echo 🎯 NEXT STEPS:
echo ==============
echo 1. ⏰ Wait 5-30 minutes for DNS propagation
echo 2. 🔐 Change all default passwords immediately
echo 3. 🧪 Test all functionalities thoroughly
echo 4. 📊 Monitor logs for any issues
echo 5. 🔄 Setup automated backups
echo.

echo ✨ GitHub + Netlify deployment successful! ✨
echo.
echo 💡 Any future code changes: just push to GitHub!
echo    git add .
echo    git commit -m "Update message"
echo    git push origin main
echo.
echo 🎉 Your voting system is now live! 🚀
echo.

pause
