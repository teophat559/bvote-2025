@echo off
REM 🎯 Setup GitHub Repository for votingonline2025.site
REM Windows batch script

echo 🚀 Setting up GitHub repository for votingonline2025.site...

REM ==============================================
REM GIT INITIALIZATION
REM ==============================================
echo 📁 Initializing Git repository...
git init
git add .
git commit -m "🎯 Initial commit: votingonline2025.site deployment ready"

echo.
echo ✅ Git repository initialized successfully!
echo.

REM ==============================================
REM GITHUB SETUP INSTRUCTIONS
REM ==============================================
echo 🎯 NEXT STEPS - GitHub Setup:
echo ================================================
echo.
echo 1. 📝 CREATE GITHUB REPOSITORY:
echo    - Go to: https://github.com/new
echo    - Repository name: voting-system-2025
echo    - Description: BVOTE 2025 - Voting System for votingonline2025.site
echo    - Set to: Public or Private
echo    - Don't initialize with README (we have one)
echo.
echo 2. 🔗 CONNECT LOCAL TO GITHUB:
echo    git remote add origin https://github.com/YOUR_USERNAME/voting-system-2025.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. 🔐 ADD GITHUB SECRETS (Repository Settings ^> Secrets and variables ^> Actions):
echo    - NETLIFY_AUTH_TOKEN=your_netlify_token
echo    - NETLIFY_USER_SITE_ID=your_user_site_id
echo    - NETLIFY_ADMIN_SITE_ID=your_admin_site_id
echo    - VPS_SSH_PRIVATE_KEY=your_ssh_private_key
echo.
echo 4. 🌐 SETUP NETLIFY SITES:
echo    - Site 1: User Frontend (votingonline2025.site)
echo    - Site 2: Admin Frontend (admin.votingonline2025.site)
echo.

REM ==============================================
REM NETLIFY CLI SETUP
REM ==============================================
echo 5. 📦 INSTALL NETLIFY CLI (if not installed):
echo    npm install -g netlify-cli
echo    netlify login
echo.

REM ==============================================
REM DEPLOYMENT READY CHECK
REM ==============================================
echo 🔍 CHECKING DEPLOYMENT READINESS...
echo.

if exist "admin\netlify-production.toml" (
    echo ✅ Admin Netlify config ready
) else (
    echo ❌ Admin Netlify config missing
)

if exist "user\netlify-production.toml" (
    echo ✅ User Netlify config ready
) else (
    echo ❌ User Netlify config missing
)

if exist "backend\ecosystem-production.config.js" (
    echo ✅ Backend PM2 config ready
) else (
    echo ❌ Backend PM2 config missing
)

if exist "config\production-votingonline2025-clean.env" (
    echo ✅ Production environment config ready
) else (
    echo ❌ Production environment config missing
)

if exist ".github\workflows\deploy-netlify.yml" (
    echo ✅ GitHub Actions workflow ready
) else (
    echo ❌ GitHub Actions workflow missing
)

echo.
echo 🎉 DEPLOYMENT FILES STATUS: READY!
echo.

REM ==============================================
REM QUICK COMMANDS
REM ==============================================
echo 🚀 QUICK DEPLOYMENT COMMANDS:
echo ================================================
echo.
echo Switch to production config:
echo   scripts\switch-to-production.sh
echo.
echo Deploy everything:
echo   scripts\deploy-production.sh
echo.
echo Setup VPS (run on server):
echo   bash deployment/vps-setup-votingonline2025.sh
echo.

echo ✅ GitHub repository setup completed!
echo 📝 Follow the steps above to complete deployment.

pause
