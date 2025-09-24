#!/bin/bash

# Stop VotingOnline2025 Services - Fixed Script
# =============================================

echo "🛑 Stopping VotingOnline2025 services..."

# Function to stop process by PID file
stop_service() {
    local service_name=$1
    local pid_file="logs/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid" 2>/dev/null
            sleep 2
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null
            fi
            echo "   ✅ $service_name stopped (PID: $pid)"
        else
            echo "   ⚪ $service_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "   ⚪ $service_name PID file not found"
    fi
}

# Stop individual services
stop_service "main"
stop_service "backend"
stop_service "production"
stop_service "dashboard"

# Additional cleanup - kill any remaining processes
echo "🧹 Performing additional cleanup..."

pkill -f "node app.js" 2>/dev/null && echo "   ✅ Killed any remaining app.js processes"
pkill -f "node backend/server.js" 2>/dev/null && echo "   ✅ Killed any remaining backend processes"
pkill -f "node production/server.js" 2>/dev/null && echo "   ✅ Killed any remaining production processes"
pkill -f "node backend/monitoring/dashboard.js" 2>/dev/null && echo "   ✅ Killed any remaining dashboard processes"

# Wait for processes to fully stop
sleep 3

echo ""
echo "✅ ALL SERVICES STOPPED"
echo "========================"
echo "🔍 To verify: ps aux | grep node"
echo "🚀 To restart: bash production/start-integrated-system.sh"
echo ""
