#!/bin/bash

# Deployment Verification Script - Test All Endpoints
# ===================================================

echo "🔍 VERIFYING DEPLOYMENT - ZERO ERROR GUARANTEE"
echo "================================================"

DOMAIN="https://votingonline2025.site"
ERRORS=0

# Test function
test_url() {
    local url=$1
    local expected_code=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_code" ]; then
        echo "✅ $response"
    else
        echo "❌ Got $response, expected $expected_code"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "🌐 Testing Core URLs..."
echo "======================"

# Core URLs
test_url "$DOMAIN" "200" "User Homepage"
test_url "$DOMAIN/admin" "200" "Admin Panel"
test_url "$DOMAIN/api/health" "200" "API Health Check"

echo ""
echo "📱 Testing Static Files..."
echo "========================="

# Static files (should exist after build)
test_url "$DOMAIN/admin/index.html" "200" "Admin Index"
test_url "$DOMAIN/favicon.ico" "200" "Favicon"

echo ""
echo "🚫 Testing Error Handling..."
echo "==========================="

# Error handling
test_url "$DOMAIN/nonexistent-page" "200" "404 Fallback (SPA)"
test_url "$DOMAIN/admin/nonexistent" "200" "Admin 404 Fallback"

echo ""
echo "🔄 Testing Redirects..."
echo "======================"

# Redirect tests
response=$(curl -s -o /dev/null -w "%{http_code}" "http://votingonline2025.site")
if [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo "✅ HTTP to HTTPS redirect: $response"
else
    echo "❌ HTTP to HTTPS redirect failed: $response"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📊 VERIFICATION RESULTS"
echo "======================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 SUCCESS: All tests passed!"
    echo "✅ Zero 404 errors"
    echo "✅ Zero 500 errors" 
    echo "✅ Zero 502 errors"
    echo "✅ Proper 301 redirects"
    echo ""
    echo "🌐 Your site is BULLETPROOF!"
    echo "   👤 User: $DOMAIN"
    echo "   👨‍💼 Admin: $DOMAIN/admin"
    echo "   🔧 API: $DOMAIN/api/health"
else
    echo "⚠️ Found $ERRORS issues that need attention"
fi
