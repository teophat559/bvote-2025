@echo off
echo ========================================
echo   BVOTE 2025 - DEPENDENCY CHECKER & FIXER
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 18+ first.
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

echo [2/5] Checking Backend Dependencies...
cd backend
echo Installing missing backend packages...
npm install validator bcrypt jsonwebtoken dotenv winston multer compression express-slow-down express-rate-limit helmet cors morgan socket.io pg sqlite3
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.

echo [3/5] Checking Admin Dependencies...
cd ..\admin
echo Installing admin dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Admin dependency installation failed
    pause
    exit /b 1
)
echo ✅ Admin dependencies installed
echo.

echo [4/5] Checking User Dependencies...
cd ..\user
echo Installing user dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ User dependency installation failed
    pause
    exit /b 1
)
echo ✅ User dependencies installed
echo.

echo [5/5] Running Security Audit...
cd ..\backend
echo Fixing security vulnerabilities (non-breaking)...
npm audit fix
echo.
echo Security audit completed (some high-severity issues may remain)
echo These can be fixed with 'npm audit fix --force' but may cause breaking changes
echo.

cd ..
echo ========================================
echo    ✅ ALL DEPENDENCIES CHECKED & FIXED!
echo ========================================
echo.
echo 📊 Summary:
echo   ✅ Backend: All packages installed
echo   ✅ Admin: Dependencies ready
echo   ✅ User: Dependencies ready
echo   ⚠️ Security: Non-breaking fixes applied
echo.
echo 🚀 Ready to start development!
echo Run: start-all-services.bat
echo.
pause
