@echo off
REM 🤖 AUTOMATED VPS FIX - Windows Script
echo 🤖 STARTING AUTOMATED VPS FIX...
echo ===================================

REM Create the automation script on VPS and run it
echo 📝 Creating automation script on VPS...

echo #!/bin/bash > vps_auto_fix.sh
echo # 🤖 AUTOMATED VPS FINAL FIX >> vps_auto_fix.sh
echo cd /home/votingonline2025.site/public_html >> vps_auto_fix.sh
echo echo "🧪 Testing health endpoint..." >> vps_auto_fix.sh
echo curl -s http://localhost:3000/api/health >> vps_auto_fix.sh
echo echo "" >> vps_auto_fix.sh
echo echo "📊 PM2 Status:" >> vps_auto_fix.sh
echo pm2 status >> vps_auto_fix.sh
echo echo "" >> vps_auto_fix.sh
echo echo "💾 Saving PM2 config..." >> vps_auto_fix.sh
echo pm2 save >> vps_auto_fix.sh
echo echo "" >> vps_auto_fix.sh
echo echo "🧪 Final health test:" >> vps_auto_fix.sh
echo curl -s http://localhost:3000/api/health ^| grep -q "status.*OK" ^&^& echo "✅ SUCCESS!" ^|^| echo "❌ FAILED" >> vps_auto_fix.sh
echo echo "" >> vps_auto_fix.sh
echo echo "🌐 Testing domain:" >> vps_auto_fix.sh
echo curl -s https://votingonline2025.site/api/health ^| head -5 >> vps_auto_fix.sh

echo.
echo 📤 Script created. Now you need to:
echo.
echo 1. Upload vps_auto_fix.sh to VPS
echo 2. SSH to VPS: ssh root@85.31.224.8
echo 3. Run: chmod +x vps_auto_fix.sh && ./vps_auto_fix.sh
echo.
echo 🎯 OR use this one-liner SSH command:
echo ssh root@85.31.224.8 "cd /home/votingonline2025.site/public_html && curl -s http://localhost:3000/api/health && pm2 status && pm2 save"
echo.
echo 🤖 AUTOMATION SCRIPT READY!
pause
