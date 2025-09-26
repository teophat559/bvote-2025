@echo off
echo ========================================
echo 🔄 BVOTE 2025 - AUTO UPDATE LAUNCHER
echo ========================================
echo.
echo Choose update mode:
echo.
echo 1. One-time complete update
echo 2. Continuous auto-update (runs every 5 minutes)
echo 3. Quick update (pull and deploy only)
echo 4. Manual update with options
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🔄 Starting one-time complete update...
    call auto-update-once.bat
) else if "%choice%"=="2" (
    echo.
    echo 🔄 Starting continuous auto-update system...
    echo This will run indefinitely. Press Ctrl+C to stop.
    pause
    call auto-update-system.bat
) else if "%choice%"=="3" (
    echo.
    echo ⚡ Quick update: Pull and deploy...
    git pull origin main
    git commit --allow-empty -m "⚡ Quick deployment - %date% %time%"
    git push origin main
    echo ✅ Quick update completed!
    echo 📊 Monitor: https://github.com/teophat559/bvote-2025/actions
    pause
) else if "%choice%"=="4" (
    echo.
    echo 🛠️ Manual update options:
    echo.
    echo A. Update dependencies only
    echo B. Build projects only  
    echo C. Deploy only
    echo D. Full manual update
    echo.
    set /p manual="Choose option (A-D): "
    
    if /i "%manual%"=="A" (
        echo 📦 Updating dependencies...
        if exist "backend\package.json" (cd backend && npm install --production && cd ..)
        if exist "admin\package.json" (cd admin && npm install && cd ..)
        if exist "package.json" (npm install)
        echo ✅ Dependencies updated
    ) else if /i "%manual%"=="B" (
        echo 🏗️ Building projects...
        if exist "admin\package.json" (cd admin && npm run build && cd ..)
        echo ✅ Projects built
    ) else if /i "%manual%"=="C" (
        echo 🚀 Deploying...
        git add .
        git commit -m "📦 Manual deployment - %date% %time%" || echo "No changes to commit"
        git push origin main
        echo ✅ Deployed
    ) else if /i "%manual%"=="D" (
        echo 🔄 Full manual update...
        call auto-update-once.bat
    )
    pause
) else if "%choice%"=="5" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)
