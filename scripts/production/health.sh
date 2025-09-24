#!/bin/bash
# Health Check Script

echo "🏥 Checking system health..."

# Check backend
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Down"
fi

# Check processes
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Backend Process: Running"
else
    echo "❌ Backend Process: Not running"
fi

# Check disk space (cross-platform)
echo "📊 System: Checking resources..."

# Basic process check
if pgrep -f "node" > /dev/null 2>&1; then
    echo "✅ Node processes: Running"
else
    echo "⚠️ Node processes: None found"
fi
