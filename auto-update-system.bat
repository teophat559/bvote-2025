@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo 🔄 BVOTE 2025 - AUTO UPDATE SYSTEM
echo ========================================
echo.
echo This system will automatically:
echo • Pull latest changes from GitHub
echo • Install/update dependencies
echo • Build projects
echo • Deploy to server
echo • Monitor and restart services
echo.

:main_loop
echo ========================================
echo 🚀 AUTO UPDATE CYCLE STARTED
echo ========================================
echo Current time: %date% %time%
echo.

REM Step 1: Pull latest changes
echo 📦 Step 1: Checking for updates...
git fetch origin
git status --porcelain >nul 2>nul

REM Check if there are remote changes
git diff HEAD origin/main --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ✨ New changes detected! Updating...
    
    REM Pull changes
    git pull origin main
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to pull changes
        goto :wait_and_retry
    )
    
    echo ✅ Code updated successfully
    
    REM Step 2: Update dependencies
    echo.
    echo 📦 Step 2: Updating dependencies...
    
    REM Backend dependencies
    if exist "backend\package.json" (
        echo Updating backend dependencies...
        cd backend
        npm install --production
        if %ERRORLEVEL% NEQ 0 (
            echo ⚠️ Backend dependency update had issues
        ) else (
            echo ✅ Backend dependencies updated
        )
        cd ..
    )
    
    REM Admin dependencies and build
    if exist "admin\package.json" (
        echo Updating admin dependencies...
        cd admin
        npm install
        if %ERRORLEVEL% EQU 0 (
            echo Building admin panel...
            npm run build
            if %ERRORLEVEL% EQU 0 (
                echo ✅ Admin built successfully
            ) else (
                echo ⚠️ Admin build had issues
            )
        ) else (
            echo ⚠️ Admin dependency update had issues
        )
        cd ..
    )
    
    REM Step 3: Auto-commit and push if there are local changes
    echo.
    echo 📤 Step 3: Checking for local changes to commit...
    git add .
    git diff --cached --quiet
    if %ERRORLEVEL% NEQ 0 (
        echo Local changes detected, committing...
        git commit -m "🔄 Auto-update: dependencies and build - %date% %time%"
        git push origin main
        echo ✅ Changes committed and pushed
    ) else (
        echo ℹ️ No local changes to commit
    )
    
    REM Step 4: Trigger deployment
    echo.
    echo 🚀 Step 4: Triggering deployment...
    git commit --allow-empty -m "🔄 Auto-deployment trigger - %date% %time%"
    git push origin main
    echo ✅ Deployment triggered
    
    echo.
    echo ✅ UPDATE CYCLE COMPLETED SUCCESSFULLY!
    
) else (
    echo ℹ️ No new changes detected
)

:wait_and_retry
echo.
echo 📊 GitHub Actions: https://github.com/teophat559/bvote-2025/actions
echo 🌐 Websites:
echo   • Main: https://votingonline2025.site
echo   • Admin: https://admin.votingonline2025.site
echo   • API: https://api.votingonline2025.site
echo.

REM Wait for next cycle (5 minutes)
echo ⏰ Waiting 5 minutes for next update cycle...
echo Press Ctrl+C to stop auto-update system
echo.

timeout /t 300 >nul

goto :main_loop
