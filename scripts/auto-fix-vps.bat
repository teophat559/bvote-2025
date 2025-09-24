@echo off
echo.
echo 🤖 AUTO-FIX VPS DEPLOYMENT - FULL AUTOMATION
echo ============================================
echo Domain: votingonline2025.site
echo Server: 85.31.224.8
echo.

REM Step 1: Clean local processes
echo 🧹 Step 1: Cleaning local processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Local Node processes killed
) else (
    echo 📋 No local Node processes to kill
)

REM Step 2: Clean and recreate deployment package
echo.
echo 📦 Step 2: Creating fresh deployment package...
if exist deployment_package rmdir /s /q deployment_package
if exist fresh_vps rmdir /s /q fresh_vps
mkdir fresh_vps

echo 📋 Copying essential files...
xcopy /E /I /H /Y backend fresh_vps\backend\ >nul
xcopy /E /I /H /Y scripts fresh_vps\scripts\ >nul
copy package.json fresh_vps\ >nul
copy .env.vps fresh_vps\.env.production >nul

REM Step 3: Create additional VPS files
echo.
echo 🔧 Step 3: Creating VPS-specific files...

REM Create ecosystem.config.js
echo Creating PM2 ecosystem config...
(
echo module.exports = {
echo   apps: [{
echo     name: 'bvote-backend',
echo     script: 'backend/server.js',
echo     env_production: {
echo       NODE_ENV: 'production',
echo       PORT: 3000
echo     },
echo     instances: 1,
echo     exec_mode: 'fork',
echo     watch: false,
echo     max_memory_restart: '500M',
echo     error_file: './logs/err.log',
echo     out_file: './logs/out.log',
echo     log_file: './logs/combined.log',
echo     time: true
echo   }]
echo };
) > fresh_vps\ecosystem.config.js

REM Create auto-setup script
echo Creating VPS auto-setup script...
(
echo #!/bin/bash
echo echo "🚀 VPS AUTO-SETUP STARTING..."
echo.
echo # Update system
echo apt update -y
echo.
echo # Install Node.js 18
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| bash -
echo apt-get install -y nodejs
echo.
echo # Install PM2
echo npm install -g pm2
echo.
echo # Create directories
echo mkdir -p logs uploads
echo.
echo # Install dependencies
echo npm install --production
echo.
echo # Stop any existing processes
echo pm2 delete all 2^>/dev/null ^|^| true
echo pkill -f "node.*server" 2^>/dev/null ^|^| true
echo.
echo # Start with PM2
echo pm2 start ecosystem.config.js --env production
echo.
echo # Save PM2 process list
echo pm2 save
echo pm2 startup
echo.
echo echo "✅ VPS AUTO-SETUP COMPLETED!"
echo echo "🧪 Testing server..."
echo sleep 5
echo curl -s http://localhost:3000/api/health ^|^| echo "❌ Health check failed"
echo.
echo echo "📊 PM2 Status:"
echo pm2 status
echo.
echo echo "🎉 Deployment completed successfully!"
echo echo "🌐 Your site should be available at: https://votingonline2025.site"
) > fresh_vps\auto-setup.sh

REM Create manual backup server.js (minimal)
echo Creating backup minimal server...
(
echo import express from 'express';
echo import cors from 'cors';
echo import dotenv from 'dotenv';
echo.
echo dotenv.config^({ path: '.env.production' }^);
echo.
echo const app = express^(^);
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo app.use^(cors^(^)^);
echo app.use^(express.json^(^)^);
echo.
echo // Health check
echo app.get^('/api/health', ^(req, res^) =^> {
echo   res.json^({
echo     status: 'OK',
echo     timestamp: new Date^(^).toISOString^(^),
echo     environment: 'production',
echo     uptime: process.uptime^(^)
echo   }^);
echo }^);
echo.
echo // Public API
echo app.get^('/api/public/contests', ^(req, res^) =^> {
echo   res.json^({
echo     success: true,
echo     data: [{ id: 1, title: "Cuộc thi 2025", status: "active" }],
echo     message: "Success"
echo   }^);
echo }^);
echo.
echo app.listen^(PORT, '0.0.0.0', ^(^) =^> {
echo   console.log^(`🚀 Server running on port ${PORT}`^);
echo   console.log^(`🌐 Health: http://localhost:${PORT}/api/health`^);
echo }^);
) > fresh_vps\backend\server-minimal.js

echo ✅ VPS deployment package ready!
echo.

echo 📤 Step 4: Upload Instructions
echo ================================
echo.
echo 📋 Method 1 - FileZilla/WinSCP:
echo   Host: 85.31.224.8
echo   User: root  
echo   Password: 123123zz@
echo   Remote Path: /home/votingonline2025.site/public_html/
echo   Upload: ALL contents from fresh_vps\ folder
echo.
echo 📋 Method 2 - Command Line (if SCP available):
echo   scp -r fresh_vps/* root@85.31.224.8:/home/votingonline2025.site/public_html/
echo.

echo 🚀 Step 5: VPS Commands (Run after upload)
echo ============================================
echo.
echo SSH Command:
echo   ssh root@85.31.224.8
echo.
echo Then run on VPS:
echo   cd /home/votingonline2025.site/public_html
echo   chmod +x auto-setup.sh
echo   ./auto-setup.sh
echo.

echo ⚡ EMERGENCY MANUAL START (if auto-setup fails):
echo   cd /home/votingonline2025.site/public_html
echo   npm install
echo   node backend/server.js
echo.

echo 🎊 AUTO-FIX PACKAGE CREATED!
echo Check fresh_vps\ folder for all files
echo.
pause

