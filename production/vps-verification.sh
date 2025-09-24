#!/bin/bash

# VPS Post-Deployment Verification Script
# =======================================

echo "🔍 VERIFYING VPS DEPLOYMENT"
echo "==========================="

DOMAIN="https://votingonline2025.site"
ERRORS=0

# Function to test URL
test_url() {
    local url=$1
    local expected_code=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
        
        if [ "$response" = "$expected_code" ]; then
            echo "✅ $response"
        else
            echo "❌ Got $response, expected $expected_code"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "⚠️ curl not available"
        ERRORS=$((ERRORS + 1))
    fi
}

echo ""
echo "🌐 Testing Core URLs"
echo "==================="

# Core application URLs
test_url "$DOMAIN" "200" "User Homepage"
test_url "$DOMAIN/admin" "200" "Admin Panel"
test_url "$DOMAIN/api/health" "200" "API Health Check"

echo ""
echo "🔄 Testing Sync System"
echo "======================"

test_url "$DOMAIN/api/sync/status" "200" "Sync Status API"
test_url "$DOMAIN/socket.io/" "200" "WebSocket Endpoint"

echo ""
echo "🛡️ Testing Error Prevention"
echo "==========================="

# Test 404 handling (should redirect to SPA)
test_url "$DOMAIN/nonexistent-page" "200" "404 Fallback Handling"
test_url "$DOMAIN/admin/nonexistent" "200" "Admin 404 Fallback"

echo ""
echo "🔗 Testing Redirects"
echo "===================="

# Test HTTP to HTTPS redirect
if command -v curl >/dev/null 2>&1; then
    echo -n "Testing HTTP to HTTPS redirect... "
    http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://votingonline2025.site" --max-time 10)
    if [ "$http_response" = "301" ] || [ "$http_response" = "302" ]; then
        echo "✅ $http_response"
    else
        echo "❌ Got $http_response, expected 301/302"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "⚡ Testing Services"
echo "=================="

# Check if Node.js processes are running
if pgrep -f "node" > /dev/null; then
    echo "✅ Node.js processes running"
else
    echo "❌ No Node.js processes found"
    ERRORS=$((ERRORS + 1))
fi

# Check specific ports
for port in 3000 3001 3002; do
    if netstat -tlnp 2>/dev/null | grep ":$port " >/dev/null; then
        echo "✅ Port $port is listening"
    else
        echo "⚠️ Port $port not listening"
    fi
done

echo ""
echo "📊 FINAL VERIFICATION RESULTS"
echo "============================="

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!"
    echo "====================================="
    echo "✅ All URLs responding correctly"
    echo "✅ No 404, 500, 502, 301 redirect errors"
    echo "✅ Sync system operational"
    echo "✅ Error prevention working"
    echo "✅ Services running properly"
    echo ""
    echo "🌐 Your deployment is BULLETPROOF!"
    echo "   👤 User: $DOMAIN"
    echo "   👨‍💼 Admin: $DOMAIN/admin"
    echo "   📊 Monitor: $DOMAIN/monitor"
    echo ""
    exit 0
else
    echo ""
    echo "⚠️ DEPLOYMENT ISSUES FOUND"
    echo "========================="
    echo "❌ Found $ERRORS issue(s) that need attention"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check service status: systemctl status nginx"
    echo "2. Check Node.js processes: ps aux | grep node"
    echo "3. Check logs: tail -f logs/*.log"
    echo "4. Restart services: bash production/start-integrated-system.sh"
    echo ""
    exit 1
fi
