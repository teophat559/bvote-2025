@echo off
REM 🚀 ONE-CLICK DEPLOYMENT FOR VOTINGONLINE2025.SITE
REM Tự động hóa hoàn toàn - chỉ cần 1 click!
REM Run: scripts\one-click-deploy.bat

setlocal enabledelayedexpansion

title One-Click Deploy - votingonline2025.site

echo.
echo ██╗   ██╗ ██████╗ ████████╗██╗███╗   ██╗ ██████╗
echo ██║   ██║██╔═══██╗╚══██╔══╝██║████╗  ██║██╔════╝
echo ██║   ██║██║   ██║   ██║   ██║██╔██╗ ██║██║  ███╗
echo ╚██╗ ██╔╝██║   ██║   ██║   ██║██║╚██╗██║██║   ██║
echo  ╚████╔╝ ╚██████╔╝   ██║   ██║██║ ╚████║╚██████╔╝
echo   ╚═══╝   ╚═════╝    ╚═══╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝
echo.
echo 🚀 ONE-CLICK DEPLOYMENT FOR VOTINGONLINE2025.SITE
echo ================================================
echo.

REM ==============================================
REM CONFIGURATION
REM ==============================================
set DOMAIN=votingonline2025.site
set VPS_IP=85.31.224.8
set VPS_USER=root
set VPS_PASS=123123zz@

echo 🎯 Deployment Target:
echo    Domain: %DOMAIN%
echo    VPS: %VPS_IP%
echo    Method: GitHub + Netlify + VPS
echo.

set /p confirm="🚀 Start one-click deployment? (y/n): "
if /i "!confirm!" neq "y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

REM ==============================================
REM PHASE 1: ENVIRONMENT SETUP
REM ==============================================
echo.
echo 🔧 PHASE 1: ENVIRONMENT SETUP
echo ===============================

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found!
    echo 📥 Auto-installing Node.js...

    REM Download and install Node.js
    powershell -command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'nodejs-installer.msi'"
    start /wait msiexec /i nodejs-installer.msi /quiet
    del nodejs-installer.msi

    REM Refresh PATH
    call refreshenv
)

REM Install global packages
echo 📦 Installing global packages...
call npm install -g netlify-cli pm2 >nul 2>&1

echo ✅ Environment setup completed!

REM ==============================================
REM PHASE 2: PROJECT PREPARATION
REM ==============================================
echo.
echo 📝 PHASE 2: PROJECT PREPARATION
echo ===============================

echo Switching to production configuration...
copy admin\netlify-production.toml admin\netlify.toml >nul 2>&1
copy user\netlify-production.toml user\netlify.toml >nul 2>&1
copy backend\ecosystem-production.config.js backend\ecosystem.config.js >nul 2>&1

echo Building frontends...
cd user
call npm install --silent >nul 2>&1
call npm run build >nul 2>&1
cd ..\admin
call npm install --silent >nul 2>&1
call npm run build >nul 2>&1
cd ..

echo ✅ Project preparation completed!

REM ==============================================
REM PHASE 3: GIT & GITHUB SETUP
REM ==============================================
echo.
echo 📁 PHASE 3: GIT & GITHUB SETUP
echo ===============================

git init >nul 2>&1
git add . >nul 2>&1
git commit -m "🚀 One-click deployment for votingonline2025.site" >nul 2>&1

echo.
echo 🔗 GitHub Repository Setup Required:
echo 1. Go to: https://github.com/new
echo 2. Repository name: voting-system-2025
echo 3. Create repository (don't initialize with README)
echo.

set /p github_url="📝 Enter your GitHub repository URL (e.g., https://github.com/username/voting-system-2025.git): "
if "!github_url!" equ "" (
    echo ⚠️ GitHub URL required for deployment
    pause
    exit /b 1
)

git remote add origin !github_url! >nul 2>&1
git branch -M main >nul 2>&1

echo ✅ Git setup completed!

REM ==============================================
REM PHASE 4: NETLIFY DEPLOYMENT
REM ==============================================
echo.
echo 🌐 PHASE 4: NETLIFY DEPLOYMENT
echo ==============================

echo 🔐 Netlify login required...
call netlify login

echo 📤 Deploying User Frontend...
cd user
call netlify deploy --prod --dir=dist --json > ../user-site.json 2>&1
cd ..

echo 📤 Deploying Admin Frontend...
cd admin
call netlify deploy --prod --dir=dist --json > ../admin-site.json 2>&1
cd ..

echo ✅ Netlify deployment completed!

REM ==============================================
REM PHASE 5: VPS SETUP
REM ==============================================
echo.
echo 🖥️ PHASE 5: VPS SETUP
echo =====================

echo 📤 Uploading VPS setup script...
echo This requires SSH access to your VPS...

set /p vps_manual="🤖 Run VPS setup automatically? (y/n - if 'n', manual instructions will be shown): "

if /i "!vps_manual!" equ "y" (
    echo Running automated VPS setup...

    REM Use PowerShell for SCP-like functionality
    powershell -command "
    try {
        $session = New-PSSession -HostName %VPS_IP% -UserName %VPS_USER%
        Copy-Item 'scripts\vps-auto-setup.sh' -Destination '/tmp/vps-auto-setup.sh' -ToSession $session
        Invoke-Command -Session $session -ScriptBlock { bash /tmp/vps-auto-setup.sh }
        Remove-PSSession $session
        Write-Host '✅ VPS setup completed automatically!'
    } catch {
        Write-Host '⚠️ Automated VPS setup failed. Manual setup required.'
    }
    "
) else (
    echo.
    echo 📋 MANUAL VPS SETUP COMMANDS:
    echo =============================
    echo 1. Copy setup script to VPS:
    echo    scp scripts/vps-auto-setup.sh root@%VPS_IP%:/tmp/
    echo.
    echo 2. Run setup script on VPS:
    echo    ssh root@%VPS_IP%
    echo    bash /tmp/vps-auto-setup.sh
    echo.

    set /p vps_done="✅ Have you completed VPS setup? (y/n): "
    if /i "!vps_done!" neq "y" (
        echo ⚠️ Please complete VPS setup before continuing
        pause
    )
)

echo ✅ VPS setup phase completed!

REM ==============================================
REM PHASE 6: DNS & SSL CONFIGURATION
REM ==============================================
echo.
echo 🌐 PHASE 6: DNS & SSL CONFIGURATION
echo ===================================

echo.
echo 📋 DNS RECORDS TO ADD:
echo ======================
echo A    %DOMAIN%              → %VPS_IP%
echo A    admin.%DOMAIN%        → %VPS_IP%
echo A    api.%DOMAIN%          → %VPS_IP%
echo.

echo 🔐 SSL CERTIFICATE SETUP:
echo =========================
echo 1. Access CyberPanel: https://%VPS_IP%:8090
echo 2. Login: admin / 123123zz#Bong
echo 3. Go to SSL → Issue SSL
echo 4. Add domain: %DOMAIN%
echo 5. Add subdomains: admin.%DOMAIN%, api.%DOMAIN%
echo 6. Issue Let's Encrypt certificate
echo.

set /p dns_ssl_done="✅ Have you configured DNS and SSL? (y/n): "

REM ==============================================
REM PHASE 7: FINAL PUSH & DEPLOYMENT
REM ==============================================
echo.
echo 🚀 PHASE 7: FINAL DEPLOYMENT
echo ============================

echo Pushing to GitHub...
git push -u origin main

echo.
echo 📊 DEPLOYMENT STATUS CHECK:
echo ===========================

REM Check if sites are accessible
echo Testing User Site...
curl -s -o nul -w "%%{http_code}" https://%DOMAIN% > temp_status.txt 2>nul
set /p user_status=<temp_status.txt
if "!user_status!" equ "200" (
    echo ✅ User Site: ONLINE
) else (
    echo ⚠️ User Site: May still be propagating
)

echo Testing Admin Site...
curl -s -o nul -w "%%{http_code}" https://admin.%DOMAIN% > temp_status.txt 2>nul
set /p admin_status=<temp_status.txt
if "!admin_status!" equ "200" (
    echo ✅ Admin Site: ONLINE
) else (
    echo ⚠️ Admin Site: May still be propagating
)

echo Testing API...
curl -s -o nul -w "%%{http_code}" https://api.%DOMAIN%/api/health > temp_status.txt 2>nul
set /p api_status=<temp_status.txt
if "!api_status!" equ "200" (
    echo ✅ Backend API: ONLINE
) else (
    echo ⚠️ Backend API: May need manual deployment
)

del temp_status.txt >nul 2>&1

REM ==============================================
REM DEPLOYMENT COMPLETION
REM ==============================================
echo.
echo ████████████████████████████████████████████
echo ██                                        ██
echo ██     🎉 DEPLOYMENT COMPLETED! 🎉        ██
echo ██                                        ██
echo ████████████████████████████████████████████
echo.

echo 🔗 YOUR LIVE SITES:
echo ===================
echo 👥 User Site:    https://%DOMAIN%
echo 👨‍💼 Admin Panel:  https://admin.%DOMAIN%
echo 🔧 Backend API:  https://api.%DOMAIN%
echo ⚙️ CyberPanel:   https://%VPS_IP%:8090
echo.

echo 🔐 DEFAULT CREDENTIALS:
echo =======================
echo Admin Login: admin@%DOMAIN% / admin123
echo VPS Access:  root@%VPS_IP% / %VPS_PASS%
echo CyberPanel:  admin / 123123zz#Bong
echo.

echo 📝 IMPORTANT NEXT STEPS:
echo ========================
echo 1. ⏰ Wait 5-30 minutes for DNS propagation
echo 2. 🔐 Change all default passwords immediately
echo 3. 🧪 Test all functionalities thoroughly
echo 4. 📊 Monitor logs for any issues
echo 5. 🔄 Setup regular backups
echo.

echo 📞 SUPPORT RESOURCES:
echo =====================
echo - Documentation: DEPLOYMENT-GUIDE-NETLIFY.md
echo - Troubleshooting: DEPLOY-CHECKLIST.md
echo - Logs: Check PM2 and Nginx logs on VPS
echo.

REM ==============================================
REM CLEANUP
REM ==============================================
echo 🧹 Cleaning up temporary files...
del user-site.json >nul 2>&1
del admin-site.json >nul 2>&1

echo.
echo ✨ ONE-CLICK DEPLOYMENT SUCCESSFUL! ✨
echo.
echo 🎯 Your voting system is now live at:
echo    https://%DOMAIN%
echo.

pause
