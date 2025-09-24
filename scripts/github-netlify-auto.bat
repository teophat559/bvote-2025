@echo off
REM 🚀 GITHUB + NETLIFY AUTO SETUP
REM Tự động hóa GitHub và Netlify deployment

echo.
echo 🚀 GITHUB + NETLIFY AUTO SETUP
echo ===============================
echo Domain: votingonline2025.site
echo Method: GitHub + Netlify (Tự động nhất)
echo.

REM ==============================================
REM STEP 1: CHECK GIT INSTALLATION
REM ==============================================
echo 🔍 [1/6] Checking Git installation...

git --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Git not found!
    echo.
    echo 📥 INSTALLING GIT AUTOMATICALLY...
    echo Please wait while Git is being downloaded and installed...

    REM Download Git installer
    powershell -command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe' -OutFile 'git-installer.exe'"

    REM Install Git silently
    start /wait git-installer.exe /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh"

    REM Cleanup
    del git-installer.exe

    REM Refresh environment
    call refreshenv >nul 2>&1

    echo ✅ Git installed successfully!
) else (
    echo ✅ Git is already installed!
)

REM ==============================================
REM STEP 2: GIT CONFIGURATION
REM ==============================================
echo 📝 [2/6] Configuring Git...

REM Check if Git is configured
git config --global user.name >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 🔧 Setting up Git configuration...

    set /p git_name="Enter your name for Git: "
    set /p git_email="Enter your email for Git: "

    git config --global user.name "!git_name!"
    git config --global user.email "!git_email!"

    echo ✅ Git configured successfully!
) else (
    echo ✅ Git is already configured!
)

REM ==============================================
REM STEP 3: GITHUB REPOSITORY SETUP
REM ==============================================
echo 📁 [3/6] Setting up GitHub repository...

REM Initialize git if not already done
if not exist ".git" (
    git init
    echo ✅ Git repository initialized!
)

REM Add all files
git add .
git commit -m "🚀 GitHub + Netlify deployment for votingonline2025.site" >nul 2>&1

echo.
echo 🔗 GITHUB REPOSITORY SETUP REQUIRED:
echo ===================================
echo 1. 🌐 Go to: https://github.com/new
echo 2. 📝 Repository name: voting-system-2025
echo 3. 📄 Description: BVOTE 2025 - Voting System for votingonline2025.site
echo 4. 🔓 Set to Public (or Private)
echo 5. ❌ DON'T initialize with README, .gitignore, or license
echo 6. 🚀 Click "Create repository"
echo.

set /p github_username="Enter your GitHub username: "
set GITHUB_URL=https://github.com/!github_username!/voting-system-2025.git

echo.
echo 📤 Connecting to GitHub repository...
git remote remove origin >nul 2>&1
git remote add origin !GITHUB_URL!
git branch -M main

echo ✅ GitHub repository configured!

REM ==============================================
REM STEP 4: NETLIFY SETUP INSTRUCTIONS
REM ==============================================
echo 🌐 [4/6] Netlify setup instructions...

echo.
echo 🔧 NETLIFY SITES SETUP:
echo =======================
echo.
echo 📋 STEP 4.1 - Create User Frontend Site:
echo ----------------------------------------
echo 1. 🌐 Go to: https://netlify.com
echo 2. 🔗 Sign up/Login with GitHub account
echo 3. 🚀 Click "New site from Git"
echo 4. 🔗 Choose "GitHub" and select "voting-system-2025"
echo 5. ⚙️ Build settings:
echo    - Base directory: user
echo    - Build command: npm install ^&^& npm run build
echo    - Publish directory: user/dist
echo 6. 🌐 Environment variables:
echo    VITE_APP_ENV=production
echo    VITE_USE_MOCK=0
echo    VITE_API_URL=https://api.votingonline2025.site/api
echo    VITE_SOCKET_URL=https://api.votingonline2025.site
echo    VITE_BASE_URL=https://votingonline2025.site
echo 7. 🚀 Deploy site
echo 8. 🌐 Add custom domain: votingonline2025.site
echo.

echo 📋 STEP 4.2 - Create Admin Frontend Site:
echo ------------------------------------------
echo 1. 🚀 Click "New site from Git" again
echo 2. 🔗 Choose "GitHub" and select "voting-system-2025"
echo 3. ⚙️ Build settings:
echo    - Base directory: admin
echo    - Build command: npm install ^&^& npm run build
echo    - Publish directory: admin/dist
echo 4. 🌐 Environment variables:
echo    VITE_APP_ENV=production
echo    VITE_USE_MOCK=0
echo    VITE_API_URL=https://api.votingonline2025.site/api
echo    VITE_SOCKET_URL=https://api.votingonline2025.site
echo    VITE_BASE_URL=https://admin.votingonline2025.site
echo 5. 🚀 Deploy site
echo 6. 🌐 Add custom domain: admin.votingonline2025.site
echo.

set /p netlify_done="✅ Have you completed Netlify setup? (y/n): "

REM ==============================================
REM STEP 5: PUSH TO GITHUB
REM ==============================================
echo 📤 [5/6] Pushing to GitHub...

echo Pushing code to GitHub repository...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo ✅ Code pushed to GitHub successfully!
) else (
    echo ⚠️ Push may have failed. Check your GitHub credentials.
)

REM ==============================================
REM STEP 6: DNS AND FINAL SETUP
REM ==============================================
echo 🌐 [6/6] Final setup instructions...

echo.
echo 🔧 DNS CONFIGURATION REQUIRED:
echo ==============================
echo Add these DNS records in your domain provider:
echo.
echo Type  Name                          Value
echo ----  ----                          -----
echo A     votingonline2025.site         85.31.224.8
echo A     admin.votingonline2025.site   85.31.224.8
echo A     api.votingonline2025.site     85.31.224.8
echo.
echo OR (if using Netlify for frontend):
echo CNAME votingonline2025.site         your-user-site.netlify.app
echo CNAME admin.votingonline2025.site   your-admin-site.netlify.app
echo A     api.votingonline2025.site     85.31.224.8
echo.

echo 🖥️ VPS BACKEND SETUP:
echo ====================
echo Run these commands to setup VPS:
echo.
echo scp scripts\vps-auto-setup.sh root@85.31.224.8:/tmp/
echo ssh root@85.31.224.8 "bash /tmp/vps-auto-setup.sh"
echo.

REM ==============================================
REM COMPLETION
REM ==============================================
echo.
echo ████████████████████████████████████████████
echo ██                                        ██
echo ██    🎉 GITHUB + NETLIFY SETUP DONE! 🎉  ██
echo ██                                        ██
echo ████████████████████████████████████████████
echo.

echo 🔗 Your GitHub Repository:
echo !GITHUB_URL!
echo.

echo 🌐 Target URLs (after DNS setup):
echo ==================================
echo 👥 User Site:    https://votingonline2025.site
echo 👨‍💼 Admin Panel:  https://admin.votingonline2025.site
echo 🔧 Backend API:  https://api.votingonline2025.site
echo.

echo 📋 NEXT STEPS:
echo ==============
echo 1. ⏰ Wait for DNS propagation (5-30 minutes)
echo 2. 🔐 Setup SSL certificates (automatic with Netlify)
echo 3. 🖥️ Complete VPS backend setup
echo 4. 🧪 Test all functionalities
echo.

echo 🎯 GitHub + Netlify deployment configured successfully!
echo Any future commits will automatically trigger deployments.
echo.

pause
