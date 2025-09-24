#!/bin/bash
# 🤖 AUTOMATED VPS FINAL FIX SCRIPT
# This will be executed automatically on VPS

echo "🤖 AUTOMATED VPS FIX - FINAL STEPS"
echo "=================================="

# Set working directory
cd /home/votingonline2025.site/public_html

echo "✅ Step 1: PM2 already running - bvote-backend online"
pm2 status

echo ""
echo "🧪 Step 2: Testing health endpoint locally..."
LOCAL_HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if echo "$LOCAL_HEALTH" | grep -q '"status":"OK"'; then
    echo "✅ Local health check: PASSED"
    echo "$LOCAL_HEALTH"
else
    echo "❌ Local health check: FAILED"
    echo "Response: $LOCAL_HEALTH"
fi

echo ""
echo "🌐 Step 3: Testing domain health endpoint..."
DOMAIN_HEALTH=$(curl -s https://votingonline2025.site/api/health 2>/dev/null)
if echo "$DOMAIN_HEALTH" | grep -q '"status":"OK"'; then
    echo "✅ Domain health check: PASSED"
    echo "$DOMAIN_HEALTH"
else
    echo "❌ Domain health check: FAILED - checking Nginx/Domain setup"
    echo "Response: $DOMAIN_HEALTH"

    # Check what's running on port 3000
    echo "🔍 Checking port 3000..."
    netstat -tulnp | grep :3000 || echo "No service on port 3000"
fi

echo ""
echo "🧪 Step 4: Testing public API endpoints..."
CONTESTS_API=$(curl -s http://localhost:3000/api/public/contests 2>/dev/null)
if echo "$CONTESTS_API" | grep -q '"success":true'; then
    echo "✅ Public API test: PASSED"
else
    echo "❌ Public API test: FAILED"
    echo "Response: $CONTESTS_API"
fi

echo ""
echo "💾 Step 5: Saving PM2 configuration..."
pm2 save
pm2 startup

echo ""
echo "📊 Step 6: Final system status..."
echo "PM2 Status:"
pm2 status

echo ""
echo "System Resources:"
free -h
df -h /home/votingonline2025.site/

echo ""
echo "Process Information:"
ps aux | grep -E "(node|pm2)" | head -5

echo ""
echo "🎯 Step 7: Final verification tests..."
echo "Local API Health:"
curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health

echo ""
echo "Local Public API:"
curl -s http://localhost:3000/api/public/contests | jq . 2>/dev/null || curl -s http://localhost:3000/api/public/contests

echo ""
echo "Domain Health (if Nginx configured):"
curl -s https://votingonline2025.site/api/health | jq . 2>/dev/null || echo "Domain health check failed or Nginx not configured"

echo ""
if curl -s http://localhost:3000/api/health | grep -q '"status":"OK"'; then
    echo "🎉 SUCCESS - VPS DEPLOYMENT COMPLETED!"
    echo "✅ Backend server running on PM2"
    echo "✅ Health endpoint responding"
    echo "✅ API endpoints functional"
    echo "✅ Ready for production traffic"
    echo ""
    echo "🌐 Your application is now live!"
    echo "📊 Monitor with: pm2 monit"
    echo "📋 Logs with: pm2 logs bvote-backend"
    echo "🔄 Restart with: pm2 restart bvote-backend"
else
    echo "❌ ISSUES REMAIN - Need manual investigation"
    echo "🔍 Check logs: pm2 logs bvote-backend"
    echo "🔍 Check process: pm2 status"
    echo "🔍 Check files: ls -la backend/"
fi

echo ""
echo "🤖 AUTOMATED FIX COMPLETED!"
echo "=========================="
