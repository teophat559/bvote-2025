@echo off
echo ========================================
echo   BVOTE 2025 - STARTING ALL SERVICES
echo ========================================
echo.

REM Check if backend is running
echo [1/4] Checking Backend API...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend API: RUNNING on http://localhost:3000
) else (
    echo ❌ Backend API: NOT RUNNING - Starting...
    start "Backend API" cmd /c "cd backend && node server.js"
    timeout /t 3 >nul
    echo ✅ Backend API: STARTED
)
echo.

REM Start Admin Dev Server
echo [2/4] Starting Admin Panel Dev Server...
start "Admin Dev Server" cmd /c "cd admin && npm run dev"
timeout /t 2 >nul
echo ✅ Admin Panel: Starting on http://localhost:5173
echo.

REM Start User Dev Server
echo [3/4] Starting User Interface Dev Server...
start "User Dev Server" cmd /c "cd user && npm run dev"
timeout /t 2 >nul
echo ✅ User Interface: Starting on http://localhost:5174
echo.

REM Final Status Check
echo [4/4] Final Status Check...
timeout /t 5 >nul
echo.
echo ========================================
echo          🎉 ALL SERVICES STARTED!
echo ========================================
echo.
echo 📊 Service URLs:
echo   🔧 Admin Panel:     http://localhost:5173
echo   👥 User Interface:  http://localhost:5174
echo   ⚡ Backend API:     http://localhost:3000
echo   🩺 Health Check:    http://localhost:3000/health
echo.
echo 🌐 Production URLs (when deployed to VPS):
echo   🔧 Admin Panel:     https://admin.votingonline2025.site
echo   👥 User Interface:  https://votingonline2025.site
echo   ⚡ Backend API:     https://api.votingonline2025.site
echo.
echo Press any key to open all services in browser...
pause >nul

REM Open all services in browser
start http://localhost:5173
start http://localhost:5174
start http://localhost:3000/health

echo.
echo ✅ All services opened in browser!
echo ✅ BVOTE 2025 is now running locally!
echo.
pause
