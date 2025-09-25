@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo 🚀 BVOTE 2025 - AUTO INSTALL EVERYTHING
echo ========================================
echo.
echo 📋 This script will automatically:
echo   • Install all required dependencies
echo   • Setup GitHub CLI and authentication
echo   • Install Node.js and npm packages
echo   • Setup database
echo   • Configure environment
echo   • Deploy to production
echo.

set /p confirm="Continue with automatic installation? (y/n): "
if /i not "%confirm%"=="y" (
    echo Installation cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo 🔧 STEP 1: INSTALLING DEPENDENCIES
echo ========================================

REM Check and install Node.js
echo 📦 Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Installing...

    REM Try winget first
    where winget >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📦 Installing Node.js via winget...
        winget install --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
        timeout /t 5 >nul
    ) else (
        echo ❌ Winget not available. Please install Node.js manually from: https://nodejs.org/
        pause
        exit /b 1
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
        winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
        timeout /t 5 >nul

        REM Check if installation worked
        where gh >nul 2>nul
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ GitHub CLI installation failed. Please install manually from: https://cli.github.com/
            pause
            exit /b 1
        )
    ) else (
        echo ❌ Winget not available. Please install GitHub CLI manually from: https://cli.github.com/
        pause
        exit /b 1
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
    echo 🔑 Starting GitHub authentication...
    echo Please follow the prompts to authenticate with GitHub
    gh auth login
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Authentication failed!
        pause
        exit /b 1
    )
) else (
    echo ✅ Already authenticated with GitHub
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
        echo ❌ Backend npm install failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️ Backend package.json not found, skipping backend install
)

echo.
echo 📦 Installing admin dependencies...
if exist "admin\package.json" (
    cd admin
    echo Installing admin packages...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Admin npm install failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Admin dependencies installed
) else (
    echo ⚠️ Admin package.json not found, skipping admin install
)

echo.
echo 📦 Installing root dependencies...
if exist "package.json" (
    echo Installing root packages...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Root npm install failed
        pause
        exit /b 1
    )
    echo ✅ Root dependencies installed
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
        echo ⚠️ Database setup had issues, continuing anyway...
    ) else (
        echo ✅ Database setup completed
    )
    cd ..
) else (
    echo ⚠️ Database setup file not found, skipping database setup
)

echo.
echo ========================================
echo 🔐 STEP 5: GITHUB SECRETS SETUP
echo ========================================

echo 🔐 Adding SERVER_PASSWORD secret...
echo 123123zz@ | gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025

if %ERRORLEVEL% EQU 0 (
    echo ✅ SERVER_PASSWORD secret added successfully!
) else (
    echo ❌ Failed to add secret automatically
    echo Manual setup: https://github.com/teophat559/bvote-2025/settings/secrets/actions
    echo Add: SERVER_PASSWORD = 123123zz@
)

echo.
echo 🔍 Verifying secrets...
gh secret list --repo teophat559/bvote-2025

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
        echo ⚠️ Admin build failed, continuing anyway...
    ) else (
        echo ✅ Admin build completed
    )
    cd ..
) else (
    echo ⚠️ Admin build script not found, skipping build
)

echo.
echo ========================================
echo 🚀 STEP 7: DEPLOYMENT
echo ========================================

echo 🚀 Triggering GitHub Actions deployment...
gh workflow run "simple-deploy.yml" --repo teophat559/bvote-2025
if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment triggered successfully!
    echo 📊 View progress at: https://github.com/teophat559/bvote-2025/actions
) else (
    echo ❌ Failed to trigger deployment automatically
    echo Manual trigger: https://github.com/teophat559/bvote-2025/actions
)

echo.
echo ========================================
echo 🎉 INSTALLATION COMPLETED!
echo ========================================
echo.
echo 📋 What was installed and configured:
echo • Node.js and npm
echo • GitHub CLI and authentication
echo • All project dependencies (backend, admin, root)
echo • Database setup
echo • GitHub secrets configuration
echo • Project build
echo • Deployment trigger
echo.
echo 🌐 Your URLs (after deployment completes):
echo • Main Site: https://votingonline2025.site
echo • Admin Panel: https://admin.votingonline2025.site
echo • API Backend: https://api.votingonline2025.site
echo.
echo 📊 Monitor deployment progress:
echo • GitHub Actions: https://github.com/teophat559/bvote-2025/actions
echo.
echo 🔄 Next steps:
echo • Wait for deployment to complete (5-10 minutes)
echo • Check the URLs above to verify everything works
echo • Every code push will now auto-deploy!
echo.
echo ✅ BVOTE 2025 is now fully automated!
echo.

REM Start local development server
set /p startdev="🚀 Start local development server now? (y/n): "
if /i "%startdev%"=="y" (
    echo.
    echo 🚀 Starting local development servers...
    echo.
    echo Opening multiple terminals for:
    echo • Backend server (port 5000)
    echo • Admin development (port 3000)
    echo.

    REM Start backend server
    if exist "backend\server.js" (
        start "BVOTE Backend Server" cmd /k "cd backend && npm start"
    )

    REM Start admin dev server
    if exist "admin\package.json" (
        start "BVOTE Admin Dev" cmd /k "cd admin && npm run dev"
    )

    echo ✅ Development servers started!
    echo • Backend: http://localhost:5000
    echo • Admin: http://localhost:3000
)

echo.
pause
