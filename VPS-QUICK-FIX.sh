#!/bin/bash

# 🔧 VPS QUICK FIX SCRIPT - votingonline2025.site
echo "🔧 FIXING VPS ISSUES - QUICK REPAIR..."
echo "====================================="

# Navigate to app directory
cd /home/votingonline2025.site/public_html || exit 1

# Step 1: Clean up existing processes
echo "🧹 Cleaning up existing processes..."
pm2 delete all 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Step 2: Check file structure
echo "📁 Checking file structure..."
if [ ! -f "backend/server.js" ]; then
    echo "❌ backend/server.js not found!"
    ls -la backend/
    exit 1
fi

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Step 4: Check environment
echo "⚙️ Setting up environment..."
if [ ! -f ".env.production" ]; then
    echo "Creating .env.production..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://voti_voting_user:123123zz@localhost:3306/voti_voting_secure_2025
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
EOF
fi

# Step 5: Test manual start first
echo "🧪 Testing manual server start..."
timeout 5 node backend/server.js &
sleep 3

# Test if server responds
if curl -s http://localhost:3000/api/health >/dev/null; then
    echo "✅ Server responding - proceeding with PM2"
    pkill -f "node.*server"

    # Start with PM2 using correct name
    echo "🚀 Starting with PM2..."
    pm2 start backend/server.js --name bvote-backend --env production

    # Save PM2 configuration
    pm2 save
    pm2 startup

    # Test PM2 version
    sleep 5
    if curl -s http://localhost:3000/api/health; then
        echo ""
        echo "✅ SUCCESS - Server running with PM2!"
        echo "📊 PM2 Status:"
        pm2 status
    else
        echo "❌ PM2 start failed, trying minimal server..."
        pm2 delete bvote-backend 2>/dev/null
        pm2 start backend/server-minimal.js --name bvote-minimal --env production
        sleep 3
        curl -s http://localhost:3000/api/health
    fi
else
    echo "❌ Manual start failed, trying minimal server..."
    pkill -f node 2>/dev/null

    # Try minimal server
    echo "🔄 Trying minimal server..."
    timeout 5 node backend/server-minimal.js &
    sleep 3

    if curl -s http://localhost:3000/api/health >/dev/null; then
        echo "✅ Minimal server works - setting up PM2..."
        pkill -f node
        pm2 start backend/server-minimal.js --name bvote-minimal --env production
        pm2 save
        sleep 3
        curl -s http://localhost:3000/api/health
    else
        echo "❌ All attempts failed - checking logs..."
        echo "📋 System info:"
        node --version
        npm --version
        ls -la backend/
        echo "🔍 Checking for Node.js errors..."
        node -e "console.log('Node.js is working')"
    fi
fi

echo ""
echo "🎯 Final Status Check:"
echo "====================="
pm2 status
echo ""
echo "🌐 Testing domain..."
curl -I https://votingonline2025.site/api/health 2>/dev/null || echo "Domain test failed"

echo ""
echo "🔧 Quick fix completed!"
echo "📞 If still issues, run: pm2 logs bvote-backend"
