@echo off
REM 🚀 Quick Deploy Script for Windows
REM votingonline2025.site deployment

echo 🚀 Quick Deploy for votingonline2025.site
echo ==========================================

REM ==============================================
REM CHECK REQUIREMENTS
REM ==============================================
echo 🔍 Checking requirements...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ NPM not found! Please install Node.js with NPM
    pause
    exit /b 1
)

where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Git not found! Please install Git
    pause
    exit /b 1
)

echo ✅ Requirements check passed!
echo.

REM ==============================================
REM BUILD FRONTENDS
REM ==============================================
echo 🔨 Building User Frontend...
cd user
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ User frontend npm install failed!
    pause
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ User frontend build failed!
    pause
    exit /b 1
)
echo ✅ User frontend built successfully!
cd ..

echo 🔨 Building Admin Frontend...
cd admin
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Admin frontend npm install failed!
    pause
    exit /b 1
)

call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Admin frontend build failed!
    pause
    exit /b 1
)
echo ✅ Admin frontend built successfully!
cd ..

REM ==============================================
REM DEPLOYMENT STATUS
REM ==============================================
echo.
echo 🎉 BUILD COMPLETED SUCCESSFULLY!
echo ================================
echo.
echo 📁 Built files:
echo   - User: user\dist\
echo   - Admin: admin\dist\
echo.
echo 🌐 Ready for deployment to:
echo   - User Site: https://votingonline2025.site
echo   - Admin Panel: https://admin.votingonline2025.site
echo   - Backend API: https://api.votingonline2025.site
echo.

REM ==============================================
REM NEXT STEPS
REM ==============================================
echo 📋 NEXT STEPS:
echo ===============
echo.
echo 1. 🔐 Setup GitHub repository and secrets
echo 2. 🌐 Create Netlify sites and get Site IDs
echo 3. 🖥️  Setup VPS with: deployment\vps-setup-votingonline2025.sh
echo 4. 🚀 Push to GitHub to trigger auto-deployment
echo.
echo 💡 OR manually deploy with Netlify CLI:
echo   cd user ^&^& netlify deploy --prod --dir=dist
echo   cd admin ^&^& netlify deploy --prod --dir=dist
echo.

echo ✅ Quick deploy preparation completed!
pause
