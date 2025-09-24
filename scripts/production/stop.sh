#!/bin/bash
# Production Stop Script

echo "🛑 Stopping BVOTE services..."

# Kill backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm logs/backend.pid
    echo "✅ Backend stopped"
fi

# Kill any remaining processes
pkill -f "node.*server.js" || true
pkill -f "npm.*dev" || true

echo "🏁 All services stopped"
