#!/bin/bash

# Robust Server Startup - Prevent 502 Errors
# ==========================================

echo "🚀 Starting VotingOnline2025 Production Server..."

# Kill existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node app.js" || true
pkill -f "node backend/server.js" || true
pkill -f "node production/server.js" || true

# Wait for processes to stop
sleep 3

# Start main application
echo "📱 Starting main application..."
nohup node app.js > logs/app.log 2>&1 &
sleep 2

# Start backend API
echo "🔧 Starting backend API..."
nohup node backend/server.js > logs/backend.log 2>&1 &
sleep 2

# Start production server
echo "🌐 Starting production server..."
nohup node production/server.js > logs/production.log 2>&1 &
sleep 2

# Verify processes are running
echo "✅ Verifying services..."
if pgrep -f "node app.js" > /dev/null; then
    echo "   ✅ Main app: RUNNING"
else
    echo "   ❌ Main app: FAILED"
fi

if pgrep -f "node backend/server.js" > /dev/null; then
    echo "   ✅ Backend API: RUNNING"  
else
    echo "   ❌ Backend API: FAILED"
fi

if pgrep -f "node production/server.js" > /dev/null; then
    echo "   ✅ Production server: RUNNING"
else
    echo "   ❌ Production server: FAILED"
fi

echo "🎉 Server startup complete!"
echo "🌐 URLs:"
echo "   👤 User: https://votingonline2025.site"
echo "   👨‍💼 Admin: https://votingonline2025.site/admin"
echo "   🔧 API: https://votingonline2025.site/api/health"
