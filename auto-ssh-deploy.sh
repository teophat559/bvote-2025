#!/bin/bash

# BVOTE 2025 - Auto SSH Deployment Script
# This script will automatically connect to your server and deploy BVOTE 2025

echo "========================================"
echo "BVOTE 2025 - Auto SSH Deployment"
echo "Domain: votingonline2025.site"
echo "Server: 85.31.224.8"
echo "========================================"
echo ""

# Server connection details
SERVER_IP="85.31.224.8"
USERNAME="root"
PASSWORD="123123zz@"
DEPLOYMENT_URL="https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh"

# Check if sshpass is available for automatic password entry
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Installing..."

    # Try to install sshpass based on OS
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        echo "❌ Cannot install sshpass automatically."
        echo "Please install sshpass or run deployment manually:"
        echo ""
        echo "ssh root@85.31.224.8"
        echo "wget $DEPLOYMENT_URL && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"
        exit 1
    fi
fi

echo "🔐 Connecting to server: $SERVER_IP"
echo "👤 Username: $USERNAME"
echo "📡 Running deployment script..."
echo ""

# Create deployment command
DEPLOY_COMMAND="wget $DEPLOYMENT_URL && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

# Execute deployment via SSH with automatic password
if sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USERNAME@$SERVER_IP" "$DEPLOY_COMMAND"; then
    echo ""
    echo "========================================"
    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
    echo "========================================"
    echo ""
    echo "🌐 Your BVOTE 2025 URLs:"
    echo "• Main Site: https://votingonline2025.site"
    echo "• Admin Panel: https://admin.votingonline2025.site"
    echo "• API Backend: https://api.votingonline2025.site"
    echo "• Health Check: https://api.votingonline2025.site/health"
    echo ""
    echo "🔧 Server Management:"
    echo "• SSH: ssh root@85.31.224.8"
    echo "• Check Status: pm2 status"
    echo "• View Logs: pm2 logs bvote-backend"
    echo ""
    echo "✅ BVOTE 2025 is now live and ready to use!"
else
    echo ""
    echo "========================================"
    echo "❌ DEPLOYMENT FAILED!"
    echo "========================================"
    echo ""
    echo "Please check the error messages above or try manual deployment:"
    echo ""
    echo "ssh root@85.31.224.8"
    echo "wget $DEPLOYMENT_URL"
    echo "chmod +x deploy-votingonline2025.sh"
    echo "./deploy-votingonline2025.sh"
    echo ""
fi

echo "Script completed."
