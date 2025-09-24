@echo off
echo 🚀 Starting Backend Development Server...
echo ================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if logs directory exists
if not exist "logs" (
    echo 📁 Creating logs directory...
    mkdir logs
)

echo ✅ Starting server on http://localhost:3000
echo 📊 Health check: http://localhost:3000/api/health
echo 📈 Monitoring: http://localhost:3000/api/monitoring/health
echo ================================

node server.js
