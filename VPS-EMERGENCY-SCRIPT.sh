#!/bin/bash
# 🚨 VPS EMERGENCY FIX SCRIPT
echo "🚨 EMERGENCY VPS FIX - votingonline2025.site"
echo "=============================================="

cd /home/votingonline2025.site/public_html

echo "🧹 Step 1: Clean processes..."
pm2 delete all 2>/dev/null
pkill -f "node" 2>/dev/null

echo "📦 Step 2: Install dependencies..."
npm install --production

echo "⚙️ Step 3: Create environment..."
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://voti_voting_user:123123zz@localhost:3306/voti_voting_secure_2025
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
EOF

echo "🚀 Step 4: Start server..."
pm2 start backend/server.js --name bvote-backend --env production

echo "💾 Step 5: Save PM2..."
pm2 save
pm2 startup

echo "🧪 Step 6: Testing..."
sleep 5
echo "Local test:"
curl -s http://localhost:3000/api/health

echo ""
echo "Domain test:"
curl -s https://votingonline2025.site/api/health

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ EMERGENCY FIX COMPLETED!"
