#!/bin/bash

# Sync System Startup Script
# ==========================

echo "🔄 Starting VotingOnline2025 Sync System..."

# Load environment
if [ -f "production/.env.sync" ]; then
    export $(cat production/.env.sync | xargs)
    echo "✅ Loaded sync environment variables"
fi

# Check Redis availability
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis connection available"
    else
        echo "⚠️ Redis not responding, starting without Redis"
    fi
else
    echo "⚠️ Redis not installed, using memory storage"
fi

# Start main application with sync integration
echo "📱 Starting main application with sync..."
nohup node app.js --enable-sync > logs/app-sync.log 2>&1 &
APP_PID=$!

# Start monitoring dashboard
echo "📊 Starting monitoring dashboard..."
nohup node backend/monitoring/dashboard.js > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!

# Wait for services to start
sleep 5

# Verify services
echo "🔍 Verifying services..."

if ps -p $APP_PID > /dev/null; then
    echo "   ✅ Main application: RUNNING (PID: $APP_PID)"
else
    echo "   ❌ Main application: FAILED"
fi

if ps -p $DASHBOARD_PID > /dev/null; then
    echo "   ✅ Monitoring dashboard: RUNNING (PID: $DASHBOARD_PID)"
else
    echo "   ❌ Monitoring dashboard: FAILED"
fi

# Test WebSocket connections
echo "🔗 Testing WebSocket connections..."
if command -v curl >/dev/null 2>&1; then
    if curl -s http://localhost:3000/socket.io/ >/dev/null; then
        echo "   ✅ Main WebSocket: AVAILABLE"
    else
        echo "   ❌ Main WebSocket: UNAVAILABLE"
    fi
    
    if curl -s http://localhost:3002/api/health >/dev/null; then
        echo "   ✅ Dashboard API: AVAILABLE"
    else
        echo "   ❌ Dashboard API: UNAVAILABLE"
    fi
fi

echo ""
echo "🎉 Sync System Startup Complete!"
echo "================================"
echo "📱 Main Application: http://localhost:3000"
echo "📊 Monitoring Dashboard: http://localhost:3002"
echo "🔧 Health Check: http://localhost:3000/api/health"
echo ""
echo "📋 To stop services:"
echo "   kill $APP_PID $DASHBOARD_PID"
echo ""
echo "📊 To view logs:"
echo "   tail -f logs/app-sync.log"
echo "   tail -f logs/dashboard.log"
