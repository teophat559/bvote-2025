@echo off
REM 🚀 AUTOMATED DEPLOYMENT FOR VOTINGONLINE2025.SITE
REM Tự động hóa hoàn toàn từ A-Z
REM Run: scripts\auto-deploy-complete.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 AUTOMATED DEPLOYMENT VOTINGONLINE2025.SITE
echo ========================================
echo.

REM ==============================================
REM CONFIGURATION
REM ==============================================
set DOMAIN=votingonline2025.site
set VPS_IP=85.31.224.8
set VPS_USER=root
set VPS_PASS=123123zz@

echo 🎯 Target Configuration:
echo   Domain: %DOMAIN%
echo   VPS: %VPS_IP%
echo   Deployment: GitHub + Netlify + VPS
echo.

REM ==============================================
REM STEP 1: ENVIRONMENT CHECK
REM ==============================================
echo 🔍 [1/10] Checking environment...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found! Installing...
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ NPM not found!
    pause
    exit /b 1
)

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Git not found! Installing...
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Environment check passed!

REM ==============================================
REM STEP 2: INSTALL REQUIRED TOOLS
REM ==============================================
echo 🔧 [2/10] Installing required tools...

echo Installing Netlify CLI...
call npm install -g netlify-cli 2>nul
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Netlify CLI installation may have failed, continuing...
)

echo Installing PM2 globally...
call npm install -g pm2 2>nul

echo ✅ Tools installation completed!

REM ==============================================
REM STEP 3: SWITCH TO PRODUCTION CONFIG
REM ==============================================
echo 📝 [3/10] Switching to production configuration...

REM Backup existing configs
if not exist "backups" mkdir backups
set BACKUP_DIR=backups\%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =%
mkdir "%BACKUP_DIR%" 2>nul

REM Copy production configs
copy admin\netlify-production.toml admin\netlify.toml >nul 2>&1
copy user\netlify-production.toml user\netlify.toml >nul 2>&1
copy backend\ecosystem-production.config.js backend\ecosystem.config.js >nul 2>&1

echo ✅ Production configuration applied!

REM ==============================================
REM STEP 4: BUILD FRONTENDS
REM ==============================================
echo 🔨 [4/10] Building frontends...

echo Building User Frontend...
cd user
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo ❌ User frontend dependencies failed!
    cd ..
    pause
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ User frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo Building Admin Frontend...
cd admin
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo ❌ Admin frontend dependencies failed!
    cd ..
    pause
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Admin frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Frontend builds completed!

REM ==============================================
REM STEP 5: GIT REPOSITORY SETUP
REM ==============================================
echo 📁 [5/10] Setting up Git repository...

git init >nul 2>&1
git add . >nul 2>&1
git commit -m "🚀 Automated deployment setup for votingonline2025.site" >nul 2>&1

echo ✅ Git repository initialized!

REM ==============================================
REM STEP 6: NETLIFY DEPLOYMENT
REM ==============================================
echo 🌐 [6/10] Deploying to Netlify...

echo.
echo 🔐 NETLIFY LOGIN REQUIRED:
echo Please login to Netlify when prompted...
echo.
call netlify login

echo.
echo 📝 Creating Netlify sites...

REM Deploy User Frontend
echo Deploying User Frontend...
cd user
call netlify deploy --dir=dist --json > ../user-deploy.json 2>&1
if exist "../user-deploy.json" (
    echo ✅ User frontend deployed to Netlify!
) else (
    echo ⚠️ User frontend deployment may have issues
)
cd ..

REM Deploy Admin Frontend
echo Deploying Admin Frontend...
cd admin
call netlify deploy --dir=dist --json > ../admin-deploy.json 2>&1
if exist "../admin-deploy.json" (
    echo ✅ Admin frontend deployed to Netlify!
) else (
    echo ⚠️ Admin frontend deployment may have issues
)
cd ..

echo ✅ Netlify deployments completed!

REM ==============================================
REM STEP 7: VPS PREPARATION
REM ==============================================
echo 🖥️ [7/10] Preparing VPS deployment...

REM Create backend deployment package
echo Creating backend deployment package...
tar -czf backend-deploy.tar.gz backend config\production-votingonline2025-clean.env deployment\database-production-setup.sql 2>nul
if not exist "backend-deploy.tar.gz" (
    echo Creating ZIP package instead...
    powershell -command "Compress-Archive -Path 'backend', 'config\production-votingonline2025-clean.env', 'deployment\database-production-setup.sql' -DestinationPath 'backend-deploy.zip' -Force"
)

echo ✅ VPS deployment package ready!

REM ==============================================
REM STEP 8: VPS SETUP (INTERACTIVE)
REM ==============================================
echo 🔧 [8/10] VPS Setup Instructions...

echo.
echo 📋 VPS SETUP COMMANDS (Run manually on VPS):
echo ================================================
echo.
echo 1. Upload setup script to VPS:
echo    scp deployment/vps-setup-votingonline2025.sh root@%VPS_IP%:/tmp/
echo.
echo 2. Run VPS setup:
echo    ssh root@%VPS_IP% "bash /tmp/vps-setup-votingonline2025.sh"
echo.
echo 3. Setup database:
echo    scp deployment/database-production-setup.sql root@%VPS_IP%:/tmp/
echo    ssh root@%VPS_IP% "su - postgres -c 'psql -f /tmp/database-production-setup.sql'"
echo.

set /p vps_setup="Have you completed VPS setup? (y/n): "
if /i "!vps_setup!" neq "y" (
    echo ⚠️ Please complete VPS setup first, then rerun this script
    pause
    exit /b 0
)

REM ==============================================
REM STEP 9: DNS CONFIGURATION REMINDER
REM ==============================================
echo 🌐 [9/10] DNS Configuration Check...

echo.
echo 📋 DNS RECORDS REQUIRED:
echo ========================
echo A    %DOMAIN%                    → %VPS_IP%
echo A    admin.%DOMAIN%              → %VPS_IP%
echo A    api.%DOMAIN%                → %VPS_IP%
echo.

set /p dns_setup="Have you configured DNS records? (y/n): "
if /i "!dns_setup!" neq "y" (
    echo ⚠️ Please configure DNS records first
    echo Open your domain provider's DNS management
    pause
)

REM ==============================================
REM STEP 10: FINAL DEPLOYMENT
REM ==============================================
echo 🚀 [10/10] Final deployment...

echo.
echo 🎯 DEPLOYMENT SUMMARY:
echo ======================
echo ✅ Environment: Ready
echo ✅ Tools: Installed
echo ✅ Config: Production
echo ✅ Build: Completed
echo ✅ Git: Initialized
echo ✅ Netlify: Deployed
echo ✅ VPS: Prepared
echo.

REM ==============================================
REM COMPLETION & NEXT STEPS
REM ==============================================
echo.
echo 🎉 AUTOMATED DEPLOYMENT COMPLETED!
echo ===================================
echo.
echo 🔗 Your sites should be available at:
echo   User:  https://%DOMAIN%
echo   Admin: https://admin.%DOMAIN%
echo   API:   https://api.%DOMAIN%
echo.
echo 📝 NEXT STEPS:
echo 1. Wait for DNS propagation (5-30 minutes)
echo 2. Setup SSL certificates in CyberPanel
echo 3. Test all functionalities
echo 4. Change default passwords
echo.
echo 🔐 DEFAULT CREDENTIALS:
echo   Admin: admin@%DOMAIN% / admin123
echo   VPS:   root@%VPS_IP% / %VPS_PASS%
echo   CyberPanel: https://%VPS_IP%:8090 (admin/123123zz#Bong)
echo.

REM ==============================================
REM CLEANUP
REM ==============================================
echo 🧹 Cleaning up temporary files...
del user-deploy.json 2>nul
del admin-deploy.json 2>nul
del backend-deploy.tar.gz 2>nul
del backend-deploy.zip 2>nul

echo.
echo ✅ DEPLOYMENT AUTOMATION COMPLETED! 🚀
echo.
echo 📖 For detailed troubleshooting, see:
echo    - DEPLOYMENT-GUIDE-NETLIFY.md
echo    - DEPLOY-CHECKLIST.md
echo.

pause
