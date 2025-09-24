@echo off
echo.
echo 🚀 BVOTE PRODUCTION STARTUP - WINDOWS
echo =====================================
echo.

REM Kill existing processes
echo 📋 Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Cleaned up existing processes
) else (
    echo 📋 No existing processes to clean
)

echo.
echo 🎯 Starting production server...
echo Backend will be available at: http://localhost:3000
echo.

REM Start production server
npm run prod:start

echo.
echo 🎉 Production server started!
echo 📊 Health: http://localhost:3000/api/health
echo 🌐 Public: http://localhost:3000/api/public/contests
echo.
pause
