#!/bin/bash
# Production Startup Script

echo "🚀 Starting BVOTE Production Deployment..."

# Kill any existing processes
echo "📋 Cleaning up existing processes..."
pkill -f "node.*server.js" || true
pkill -f "npm.*dev" || true

# Set environment
export NODE_ENV=production
export PORT=3000

# Start backend
echo "🎯 Starting backend server..."
cd backend
nohup node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid

sleep 3

# Verify backend is running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start admin frontend
echo "🎨 Starting admin frontend..."
cd ../admin
npm run build > ../logs/admin-build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Admin frontend built successfully"
else
    echo "⚠️ Admin frontend build had warnings"
fi

# Start user frontend  
echo "👤 Starting user frontend..."
cd ../user
npm run build > ../logs/user-build.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ User frontend built successfully"
else
    echo "⚠️ User frontend build had warnings"
fi

echo "🎉 Production deployment completed!"
echo "📊 Backend: http://localhost:3000"
echo "🎯 Admin: Built in admin/dist/"
echo "👥 User: Built in user/dist/"
