#!/bin/bash

# VPS MANUAL START SCRIPT - votingonline2025.site
echo "🚀 VPS MANUAL START - votingonline2025.site"
echo "=========================================="

# Set environment
export NODE_ENV=production
export PORT=3000

# Stop existing processes
echo "🛑 Stopping existing Node processes..."
pkill -f "node.*server.js" || true

# Check if backend exists
if [ ! -f "backend/server.js" ]; then
    echo "❌ backend/server.js not found!"
    echo "📋 Current directory contents:"
    ls -la
    exit 1
fi

# Start server manually
echo "🎯 Starting backend server..."
cd backend
nohup node server.js > ../logs/manual.log 2>&1 &
BACKEND_PID=$!

echo "📊 Backend started with PID: $BACKEND_PID"
echo $BACKEND_PID > ../logs/backend.pid

cd ..

# Wait and test
sleep 5

echo "🧪 Testing server..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is responding!"
    curl http://localhost:3000/api/health
else
    echo "❌ Server not responding, checking logs..."
    tail -n 20 logs/manual.log
fi

echo ""
echo "📋 Process info:"
ps aux | grep node | grep -v grep

echo ""
echo "🔍 Port check:"
netstat -tulnp | grep :3000

echo "🎉 Manual start completed!"
