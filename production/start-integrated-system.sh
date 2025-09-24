#!/bin/bash

# VotingOnline2025 - Integrated Startup with Sync System
# ======================================================

echo "🚀 Starting VotingOnline2025 with Sync System..."
echo "================================================"

# Load environment
if [ -f "production/.env.production" ]; then
    export $(cat production/.env.production | xargs)
    echo "✅ Loaded production environment"
fi

if [ -f "production/.env.sync" ]; then
    export $(cat production/.env.sync | xargs)
    echo "✅ Loaded sync environment"
fi

# Enable sync system
export ENABLE_SYNC=true

# Create logs directory
mkdir -p logs

# Check Redis (optional for sync)
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis available for sync scaling"
        export REDIS_AVAILABLE=true
    else
        echo "⚠️ Redis not responding, using memory sync"
        export REDIS_AVAILABLE=false
    fi
else
    echo "ℹ️ Redis not installed, using memory sync (suitable for single server)"
    export REDIS_AVAILABLE=false
fi

# Stop existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node app.js" || true
pkill -f "node backend/server.js" || true
pkill -f "node production/server.js" || true
pkill -f "node backend/monitoring/dashboard.js" || true

# Wait for processes to stop
sleep 3

# Start main application with sync
echo "📱 Starting main application with sync integration..."
nohup node app.js --enable-sync > logs/app-with-sync.log 2>&1 &
MAIN_PID=$!

# Start backend API server
echo "🔧 Starting backend API server..."
nohup node backend/server.js > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Start production server
echo "🌐 Starting production server..."
nohup node production/server.js > logs/production.log 2>&1 &
PROD_PID=$!

# Start monitoring dashboard
echo "📊 Starting monitoring dashboard..."
nohup node backend/monitoring/dashboard.js > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!

# Wait for all services to start
echo "⏳ Waiting for services to initialize..."
sleep 8

# Verify all services
echo "🔍 Verifying integrated services..."

services_status=0

if ps -p $MAIN_PID > /dev/null; then
    echo "   ✅ Main application with sync: RUNNING (PID: $MAIN_PID)"
else
    echo "   ❌ Main application: FAILED"
    services_status=1
fi

if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✅ Backend API server: RUNNING (PID: $BACKEND_PID)"
else
    echo "   ❌ Backend API: FAILED"
    services_status=1
fi

if ps -p $PROD_PID > /dev/null; then
    echo "   ✅ Production server: RUNNING (PID: $PROD_PID)"
else
    echo "   ❌ Production server: FAILED"
    services_status=1
fi

if ps -p $DASHBOARD_PID > /dev/null; then
    echo "   ✅ Monitoring dashboard: RUNNING (PID: $DASHBOARD_PID)"
else
    echo "   ❌ Monitoring dashboard: FAILED"
    services_status=1
fi

# Test endpoints
echo "🔗 Testing service endpoints..."
if command -v curl >/dev/null 2>&1; then
    
    # Test main application
    if curl -s http://localhost:3000/api/health >/dev/null; then
        echo "   ✅ Main application API: RESPONDING"
    else
        echo "   ⚠️ Main application API: NOT RESPONDING"
    fi
    
    # Test sync status
    if curl -s http://localhost:3000/api/sync/status >/dev/null; then
        echo "   ✅ Sync system: ACTIVE"
    else
        echo "   ⚠️ Sync system: INACTIVE"
    fi
    
    # Test monitoring dashboard
    if curl -s http://localhost:3002/api/health >/dev/null; then
        echo "   ✅ Monitoring dashboard: RESPONDING"
    else
        echo "   ⚠️ Monitoring dashboard: NOT RESPONDING"
    fi
    
    # Test WebSocket
    if curl -s http://localhost:3000/socket.io/ >/dev/null; then
        echo "   ✅ WebSocket server: AVAILABLE"
    else
        echo "   ⚠️ WebSocket server: UNAVAILABLE"
    fi
fi

# Save PIDs for management
echo "$MAIN_PID" > logs/main.pid
echo "$BACKEND_PID" > logs/backend.pid
echo "$PROD_PID" > logs/production.pid
echo "$DASHBOARD_PID" > logs/dashboard.pid

echo ""
if [ $services_status -eq 0 ]; then
    echo "🎉 INTEGRATED SYSTEM STARTUP SUCCESSFUL!"
    echo "========================================"
else
    echo "⚠️ SOME SERVICES FAILED TO START"
    echo "================================"
fi

echo ""
echo "🌐 Service URLs:"
echo "   👤 User Interface: https://votingonline2025.site"
echo "   👨‍💼 Admin Panel: https://votingonline2025.site/admin"
echo "   📊 Monitoring Dashboard: https://votingonline2025.site:3002"
echo "   🔧 API Health: https://votingonline2025.site/api/health"
echo "   🔄 Sync Status: https://votingonline2025.site/api/sync/status"
echo ""
echo "📋 Management Commands:"
echo "   Stop all: bash production/stop-all-services.sh"
echo "   View logs: tail -f logs/app-with-sync.log"
echo "   Monitor: watch curl -s http://localhost:3000/api/sync/status"
echo ""
echo "🎯 Integration Features Active:"
echo "   ✅ Real-time Admin-User sync"
echo "   ✅ Connection monitoring"
echo "   ✅ Auto-reconnection"
echo "   ✅ State synchronization"
echo "   ✅ Performance monitoring"

# Return status
exit $services_status
