@echo off
echo ========================================
echo 🚀 BVOTE 2025 - AUTO INSTALL (NO PROMPTS)
echo ========================================
echo.
echo Starting automatic installation...
echo This will install everything without prompts.
echo.

timeout /t 3 >nul

REM Run the auto install script with automatic confirmation
echo y | auto-install-everything.bat

echo.
echo Installation process completed!
pause
