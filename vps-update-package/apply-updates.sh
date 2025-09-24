#!/bin/bash
# VPS UPDATE SCRIPT - Apply Real Mode Configuration
echo "🚀 APPLYING REAL MODE UPDATES ON VPS..."

# Backup existing files
echo "💾 BACKUP: Current files"
cp /home/votingonline2025.site/public_html/user/src/adaptors/config.js /home/votingonline2025.site/public_html/user/src/adaptors/config.js.backup.$(date +%s) 2>/dev/null || echo "No user config to backup"
cp /home/votingonline2025.site/public_html/admin/.env /home/votingonline2025.site/public_html/admin/.env.backup.$(date +%s) 2>/dev/null || echo "No admin .env to backup"
cp /home/votingonline2025.site/public_html/user/.env /home/votingonline2025.site/public_html/user/.env.backup.$(date +%s) 2>/dev/null || echo "No user .env to backup"

# Apply updates
echo "🔧 APPLY: User config (Real mode)"
mkdir -p /home/votingonline2025.site/public_html/user/src/adaptors
cp user-config.js /home/votingonline2025.site/public_html/user/src/adaptors/config.js

echo "🔧 APPLY: Admin .env (Real mode)"
cp admin.env /home/votingonline2025.site/public_html/admin/.env

echo "🔧 APPLY: User .env (Real mode)"
cp user.env /home/votingonline2025.site/public_html/user/.env

# Verify changes
echo "✅ VERIFY: Applied changes"
echo "User config mode:"
grep "mode:" /home/votingonline2025.site/public_html/user/src/adaptors/config.js | head -1

echo "Admin .env:"
cat /home/votingonline2025.site/public_html/admin/.env | grep "VITE_USE_MOCK"

echo "User .env:"
cat /home/votingonline2025.site/public_html/user/.env | grep "VITE_USE_MOCK"

# Restart services if needed
echo "🔄 RESTART: PM2 processes (if any)"
pm2 restart all 2>/dev/null || echo "No PM2 processes to restart"

echo "🎉 SUCCESS: Real mode configuration applied!"
echo "📱 Frontend will now use real data from backend"
echo "🌐 Test at: https://votingonline2025.site/"

