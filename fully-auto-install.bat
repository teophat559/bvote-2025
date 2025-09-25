@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo 🚀 BVOTE 2025 - FULLY AUTO INSTALL
echo ========================================
echo.
echo 📋 Installing everything automatically:
echo   • Node.js and GitHub CLI
echo   • All project dependencies
echo   • Database setup
echo   • GitHub secrets
echo   • Build and deployment
echo.

echo ========================================
echo 🔧 STEP 1: INSTALLING DEPENDENCIES
echo ========================================

REM Check and install Node.js
echo 📦 Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Installing...
    where winget >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📦 Installing Node.js via winget...
        winget install --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements --silent
        timeout /t 10 >nul
    ) else (
        echo ⚠️ Winget not available, please install Node.js manually from: https://nodejs.org/
    )
) else (
    echo ✅ Node.js already installed
    node --version
)

REM Check and install GitHub CLI
echo.
echo 📦 Checking GitHub CLI...
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found. Installing...
    where winget >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📦 Installing GitHub CLI via winget...
        winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements --silent
        timeout /t 10 >nul

        REM Check if installation worked
        where gh >nul 2>nul
        if %ERRORLEVEL% NEQ 0 (
            echo ⚠️ GitHub CLI installation may need terminal restart
        )
    ) else (
        echo ⚠️ Winget not available, please install GitHub CLI manually from: https://cli.github.com/
    )
) else (
    echo ✅ GitHub CLI already installed
    gh --version
)

echo.
echo ========================================
echo 🔐 STEP 2: GITHUB AUTHENTICATION
echo ========================================

echo 🔐 Checking GitHub authentication...
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ GitHub not authenticated. Please run: gh auth login
    echo ⚠️ Skipping GitHub operations for now...
    set GITHUB_AUTH=false
) else (
    echo ✅ GitHub authenticated
    set GITHUB_AUTH=true
)

echo.
echo ========================================
echo 📦 STEP 3: INSTALLING PROJECT DEPENDENCIES
echo ========================================

echo 📦 Installing backend dependencies...
if exist "backend\package.json" (
    cd backend
    echo Installing backend packages...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Backend npm install had issues, continuing...
    ) else (
        echo ✅ Backend dependencies installed
    )
    cd ..
) else (
    echo ⚠️ Backend package.json not found
)

echo.
echo 📦 Installing admin dependencies...
if exist "admin\package.json" (
    cd admin
    echo Installing admin packages...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Admin npm install had issues, continuing...
    ) else (
        echo ✅ Admin dependencies installed
    )
    cd ..
) else (
    echo ⚠️ Admin package.json not found
)

echo.
echo 📦 Installing root dependencies...
if exist "package.json" (
    echo Installing root packages...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Root npm install had issues, continuing...
    ) else (
        echo ✅ Root dependencies installed
    )
) else (
    echo ⚠️ Root package.json not found
)

echo.
echo ========================================
echo 🗄️ STEP 4: DATABASE SETUP
echo ========================================

echo 🗄️ Setting up database...
if exist "backend\database.js" (
    cd backend
    echo Running database setup...
    node database.js
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Database setup had issues, continuing...
    ) else (
        echo ✅ Database setup completed
    )
    cd ..
) else (
    echo ⚠️ Database setup file not found
)

echo.
echo ========================================
echo 🔐 STEP 5: GITHUB SECRETS SETUP
echo ========================================

if "%GITHUB_AUTH%"=="true" (
    echo 🔐 Adding SERVER_PASSWORD secret...
    echo 123123zz@ | gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025

    if %ERRORLEVEL% EQU 0 (
        echo ✅ SERVER_PASSWORD secret added successfully!
    ) else (
        echo ⚠️ Failed to add secret automatically
    )

    echo.
    echo 🔍 Verifying secrets...
    gh secret list --repo teophat559/bvote-2025
) else (
    echo ⚠️ Skipping GitHub secrets (not authenticated)
)

echo.
echo ========================================
echo 🏗️ STEP 6: BUILDING PROJECT
echo ========================================

echo 🏗️ Building admin panel...
if exist "admin\package.json" (
    cd admin
    echo Building admin...
    npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️ Admin build had issues, continuing...
    ) else (
        echo ✅ Admin build completed
    )
    cd ..
) else (
    echo ⚠️ Admin build script not found
)

echo.
echo ========================================
echo 🚀 STEP 7: DEPLOYMENT
echo ========================================

if "%GITHUB_AUTH%"=="true" (
    echo 🚀 Triggering GitHub Actions deployment...
    gh workflow run "simple-deploy.yml" --repo teophat559/bvote-2025
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Deployment triggered successfully!
        echo 📊 View progress at: https://github.com/teophat559/bvote-2025/actions
    ) else (
        echo ⚠️ Failed to trigger deployment
    )
) else (
    echo ⚠️ Skipping deployment (not authenticated)
)

echo.
echo ========================================
echo 🎉 INSTALLATION COMPLETED!
echo ========================================
echo.

echo 📋 What was processed:
echo • Dependencies installation
echo • Project packages installation
echo • Database setup
if "%GITHUB_AUTH%"=="true" (
    echo • GitHub secrets configuration
    echo • Deployment trigger
) else (
    echo • GitHub authentication needed for secrets and deployment
)
echo.

echo 🌐 Your URLs (after deployment completes):
echo • Main Site: https://votingonline2025.site
echo • Admin Panel: https://admin.votingonline2025.site
echo • API Backend: https://api.votingonline2025.site
echo.

if "%GITHUB_AUTH%"=="false" (
    echo 🔐 To complete setup, please:
    echo 1. Run: gh auth login
    echo 2. Run this script again for GitHub operations
    echo.
)

echo 📊 Monitor deployment: https://github.com/teophat559/bvote-2025/actions
echo.
echo ✅ BVOTE 2025 auto-installation completed!
echo.

REM Start development servers
echo 🚀 Starting local development servers...
if exist "backend\server.js" (
    echo Starting backend server...
    start "BVOTE Backend" cmd /k "cd backend && npm start"
)

if exist "admin\package.json" (
    echo Starting admin dev server...
    start "BVOTE Admin" cmd /k "cd admin && npm run dev"
)

echo.
echo ✅ Development servers started!
echo • Backend: http://localhost:5000
echo • Admin: http://localhost:3000
echo.

REM Ask about SSH deployment setup
set /p ssh_setup="🔐 Setup SSH deployment for enhanced security? (y/n): "
if /i "%ssh_setup%"=="y" (
    echo.
    echo 🔐 Starting SSH deployment setup...
    call setup-ssh-deployment.bat
)

echo.
pause
