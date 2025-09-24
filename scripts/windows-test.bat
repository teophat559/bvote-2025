@echo off
echo.
echo 🧪 BVOTE SYSTEM TEST - WINDOWS
echo ==============================
echo.

echo 📋 Running comprehensive system test...
node scripts/quick-test.js

echo.
echo 🏥 Additional Health Checks...

curl -s http://localhost:3000/api/health > temp_health.json
if %errorlevel% == 0 (
    echo ✅ Backend Health: OK
) else (
    echo ❌ Backend Health: FAILED
)

curl -s http://localhost:3000/api/public/contests > temp_contests.json
if %errorlevel% == 0 (
    echo ✅ Public API: OK
) else (
    echo ❌ Public API: FAILED
)

curl -s http://localhost:3000/api/monitoring/metrics > temp_metrics.json
if %errorlevel% == 0 (
    echo ✅ Monitoring: OK
) else (
    echo ❌ Monitoring: FAILED
)

REM Cleanup temp files
del temp_*.json >nul 2>&1

echo.
echo 🎉 System test completed!
echo.
pause
