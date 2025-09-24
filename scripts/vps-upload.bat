@echo off
echo.
echo 📤 VPS UPLOAD SCRIPT - votingonline2025.site
echo ===============================================
echo.

REM Configuration
set VPS_HOST=85.31.224.8
set VPS_USER=root
set VPS_PATH=/home/votingonline2025.site/public_html

echo 🎯 Target VPS Info:
echo   Host: %VPS_HOST%
echo   User: %VPS_USER%
echo   Path: %VPS_PATH%
echo.

echo 📦 Creating deployment package...
if exist deployment_package rmdir /s /q deployment_package
mkdir deployment_package

echo 📋 Copying files...
xcopy /E /I /H /Y . deployment_package\ >nul
cd deployment_package

echo 🧹 Cleaning deployment package...
if exist node_modules rmdir /s /q node_modules
if exist admin\node_modules rmdir /s /q admin\node_modules
if exist admin\dist rmdir /s /q admin\dist
if exist user\node_modules rmdir /s /q user\node_modules
if exist user\dist rmdir /s /q user\dist
if exist .git rmdir /s /q .git
if exist logs rmdir /s /q logs
mkdir logs

echo 🔧 Setting up VPS environment...
copy .env.vps .env.production >nul

cd ..

echo ✅ Deployment package ready in: deployment_package\
echo.

echo 📤 UPLOAD COMMANDS:
echo.
echo Using SCP (if available):
echo   scp -r deployment_package/* %VPS_USER%@%VPS_HOST%:%VPS_PATH%/
echo.
echo Using SFTP:
echo   sftp %VPS_USER%@%VPS_HOST%
echo   cd %VPS_PATH%
echo   put -r deployment_package/*
echo.
echo Using FileZilla/WinSCP:
echo   Host: %VPS_HOST%
echo   User: %VPS_USER%
echo   Password: 123123zz@
echo   Remote Path: %VPS_PATH%
echo   Upload: deployment_package/* contents
echo.

echo 🚀 NEXT STEPS AFTER UPLOAD:
echo.
echo 1. SSH to VPS:
echo    ssh %VPS_USER%@%VPS_HOST%
echo.
echo 2. Navigate to project:
echo    cd %VPS_PATH%
echo.
echo 3. Run setup:
echo    chmod +x scripts/vps-setup.sh
echo    bash scripts/vps-setup.sh
echo.
echo 4. Start production:
echo    npm run vps:start
echo.

echo 🎉 Ready for VPS deployment!
echo.
pause
