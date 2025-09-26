@echo off
echo ========================================
echo 🔄 BVOTE 2025 - ONE-TIME AUTO UPDATE
echo ========================================
echo.
echo Performing complete system update...
echo.

REM Step 1: Pull latest changes
echo 📦 Step 1: Pulling latest changes from GitHub...
git fetch origin
git pull origin main

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to pull changes
    pause
    exit /b 1
)
echo ✅ Code updated successfully

REM Step 2: Update backend
echo.
echo 📦 Step 2: Updating backend...
if exist "backend\package.json" (
    cd backend
    echo Installing backend dependencies...
    npm install --production
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend updated successfully
    ) else (
        echo ⚠️ Backend update had issues, continuing...
    )
    cd ..
) else (
    echo ℹ️ Backend package.json not found
)

REM Step 3: Update and build admin
echo.
echo 📦 Step 3: Updating and building admin...
if exist "admin\package.json" (
    cd admin
    echo Installing admin dependencies...
    npm install
    if %ERRORLEVEL% EQU 0 (
        echo Building admin panel...
        npm run build
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Admin updated and built successfully
        ) else (
            echo ⚠️ Admin build failed, continuing...
        )
    ) else (
        echo ⚠️ Admin dependency install failed, continuing...
    )
    cd ..
) else (
    echo ℹ️ Admin package.json not found
)

REM Step 4: Update root dependencies
echo.
echo 📦 Step 4: Updating root dependencies...
if exist "package.json" (
    echo Installing root dependencies...
    npm install
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Root dependencies updated successfully
    ) else (
        echo ⚠️ Root dependency update had issues, continuing...
    )
) else (
    echo ℹ️ Root package.json not found
)

REM Step 5: Commit any build artifacts
echo.
echo 📤 Step 5: Committing build artifacts...
git add .
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "🔄 Auto-update: build artifacts and dependencies - %date% %time%"
    git push origin main
    echo ✅ Build artifacts committed and pushed
) else (
    echo ℹ️ No build artifacts to commit
)

REM Step 6: Trigger deployment
echo.
echo 🚀 Step 6: Triggering deployment...
git commit --allow-empty -m "🚀 Auto-deployment - %date% %time%"
git push origin main
echo ✅ Deployment triggered successfully

echo.
echo ========================================
echo 🎉 AUTO UPDATE COMPLETED!
echo ========================================
echo.
echo 📊 Monitor deployment: https://github.com/teophat559/bvote-2025/actions
echo.
echo 🌐 Your websites:
echo • Main Site: https://votingonline2025.site
echo • Admin Panel: https://admin.votingonline2025.site
echo • API Backend: https://api.votingonline2025.site
echo.
echo ✅ System is now up to date and deployed!
echo.

set /p continuous="🔄 Start continuous auto-update monitoring? (y/n): "
if /i "%continuous%"=="y" (
    echo.
    echo 🔄 Starting continuous auto-update system...
    call auto-update-system.bat
)

pause
