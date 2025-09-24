#!/bin/bash

# VPS DEBUG SCRIPT - votingonline2025.site
echo "🔍 VPS DEPLOYMENT DEBUG"
echo "====================="

echo "📋 Current Directory:"
pwd

echo ""
echo "📂 Directory Contents:"
ls -la

echo ""
echo "📦 Check package.json exists:"
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "📋 Available scripts:"
    grep -A 20 '"scripts"' package.json
else
    echo "❌ package.json NOT found"
fi

echo ""
echo "📁 Check scripts directory:"
if [ -d "scripts" ]; then
    echo "✅ scripts directory found"
    echo "📋 Scripts contents:"
    ls -la scripts/
else
    echo "❌ scripts directory NOT found"
fi

echo ""
echo "🔧 Check Node.js and npm:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo ""
echo "🗄️ Check backend directory:"
if [ -d "backend" ]; then
    echo "✅ backend directory found"
    ls -la backend/
else
    echo "❌ backend directory NOT found"
fi

echo ""
echo "🔍 Check environment files:"
ls -la .env*

echo ""
echo "📊 System info:"
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h . | tail -1)"

echo ""
echo "🎯 Diagnosis complete!"
