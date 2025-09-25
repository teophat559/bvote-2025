@echo off
echo ========================================
echo 🚀 BVOTE 2025 - AUTO INSTALLER
echo ========================================
echo.
echo Choose installation method:
echo.
echo 1. Auto Install Everything (Batch - Recommended)
echo 2. Auto Install Everything (PowerShell)
echo 3. Simple GitHub Setup Only
echo 4. Manual Setup Guide
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting automatic installation (Batch)...
    call auto-install-everything.bat
) else if "%choice%"=="2" (
    echo.
    echo 🚀 Starting automatic installation (PowerShell)...
    powershell -ExecutionPolicy Bypass -File auto-install-everything.ps1
) else if "%choice%"=="3" (
    echo.
    echo 🔐 Starting GitHub setup only...
    call simple-github-setup.bat
) else if "%choice%"=="4" (
    echo.
    echo 📋 Opening manual setup guide...
    call manual-github-setup.bat
) else if "%choice%"=="5" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)

pause
