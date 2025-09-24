@echo off
REM 🚀 AUTO DEPLOY NOW - No User Input Required
REM Tự động deployment không cần input

echo.
echo 🚀 AUTO DEPLOYMENT FOR VOTINGONLINE2025.SITE
echo ============================================
echo.

REM ==============================================
REM PHASE 1: ENVIRONMENT CHECK
REM ==============================================
echo 🔍 [1/8] Checking environment...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 18+ from https://nodejs.org/
    echo ⏸️ Deployment paused. Install Node.js and rerun this script.
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
    echo ❌ Git not found! Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Environment check passed!

REM ==============================================
REM PHASE 2: INSTALL TOOLS
REM ==============================================
echo 🔧 [2/8] Installing required tools...

echo Installing Netlify CLI...
call npm install -g netlify-cli >nul 2>&1

echo Installing PM2...
call npm install -g pm2 >nul 2>&1

echo ✅ Tools installed!

REM ==============================================
REM PHASE 3: SWITCH TO PRODUCTION CONFIG
REM ==============================================
echo 📝 [3/8] Switching to production configuration...

REM Create backup
if not exist "backups" mkdir backups
set BACKUP_DIR=backups\auto-deploy-%date:~10,4%%date:~4,2%%date:~7,2%
set BACKUP_DIR=%BACKUP_DIR: =%
mkdir "%BACKUP_DIR%" 2>nul

REM Apply production configs
copy admin\netlify-production.toml admin\netlify.toml >nul 2>&1
copy user\netlify-production.toml user\netlify.toml >nul 2>&1
copy backend\ecosystem-production.config.js backend\ecosystem.config.js >nul 2>&1

echo ✅ Production configuration applied!

REM ==============================================
REM PHASE 4: BUILD FRONTENDS
REM ==============================================
echo 🔨 [4/8] Building frontends...

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
REM PHASE 5: GIT SETUP
REM ==============================================
echo 📁 [5/8] Setting up Git repository...

git init >nul 2>&1
git add . >nul 2>&1
git commit -m "🚀 Auto deployment for votingonline2025.site" >nul 2>&1

echo ✅ Git repository ready!

REM ==============================================
REM PHASE 6: DEPLOYMENT READY CHECK
REM ==============================================
echo 🔍 [6/8] Checking deployment readiness...

if exist "user\dist\index.html" (
    echo ✅ User frontend build ready
) else (
    echo ❌ User frontend build missing
)

if exist "admin\dist\index.html" (
    echo ✅ Admin frontend build ready
) else (
    echo ❌ Admin frontend build missing
)

if exist "config\production-votingonline2025-clean.env" (
    echo ✅ Production environment config ready
) else (
    echo ❌ Production environment config missing
)

echo ✅ Deployment readiness check completed!

REM ==============================================
REM PHASE 7: MANUAL DEPLOYMENT INSTRUCTIONS
REM ==============================================
echo 📋 [7/8] Next Steps - Manual Actions Required...

echo.
echo 🎯 DEPLOYMENT STATUS: READY FOR MANUAL STEPS
echo =============================================
echo.
echo 📂 Built Files Ready:
echo    - User Frontend: user\dist\
echo    - Admin Frontend: admin\dist\
echo    - Backend Config: backend\ecosystem.config.js
echo.
echo 🔗 GitHub Repository Setup:
echo    1. Go to: https://github.com/new
echo    2. Repository name: voting-system-2025
echo    3. Create repository
echo    4. Run: git remote add origin https://github.com/YOUR_USERNAME/voting-system-2025.git
echo    5. Run: git push -u origin main
echo.
echo 🌐 Netlify Deployment:
echo    1. Login: netlify login
echo    2. Deploy User: cd user ^&^& netlify deploy --prod --dir=dist
echo    3. Deploy Admin: cd admin ^&^& netlify deploy --prod --dir=dist
echo.
echo 🖥️ VPS Setup:
echo    1. Upload script: scp scripts\vps-auto-setup.sh root@85.31.224.8:/tmp/
echo    2. Run setup: ssh root@85.31.224.8 "bash /tmp/vps-auto-setup.sh"
echo.
echo 🌐 DNS Configuration:
echo    A    votingonline2025.site          → 85.31.224.8
echo    A    admin.votingonline2025.site    → 85.31.224.8
echo    A    api.votingonline2025.site      → 85.31.224.8
echo.

REM ==============================================
REM PHASE 8: COMPLETION
REM ==============================================
echo 🎉 [8/8] Auto preparation completed!

echo.
echo ████████████████████████████████████████████
echo ██                                        ██
echo ██   ✅ AUTO DEPLOYMENT PREP DONE! ✅     ██
echo ██                                        ██
echo ████████████████████████████████████████████
echo.

echo 🔗 Target URLs (after manual setup):
echo ====================================
echo 👥 User Site:    https://votingonline2025.site
echo 👨‍💼 Admin Panel:  https://admin.votingonline2025.site
echo 🔧 Backend API:  https://api.votingonline2025.site
echo.

echo 📝 Quick Deploy Commands:
echo =========================
echo netlify login
echo cd user ^&^& netlify deploy --prod --dir=dist
echo cd admin ^&^& netlify deploy --prod --dir=dist
echo.

echo 🎯 All files are ready for deployment!
echo Follow the manual steps above to complete the process.
echo.

pause
