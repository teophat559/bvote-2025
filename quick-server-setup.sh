#!/bin/bash

# BVOTE 2025 - Quick Server Setup (Minimal Version)
# Run this if you need a fast deployment

echo "⚡ BVOTE 2025 - Quick Setup Starting..."

# Quick setup for immediate deployment
BACKEND_PATH="/home/votingonline2025.site/public_html/backend"

# Create directory and navigate
mkdir -p "$BACKEND_PATH"
cd "$BACKEND_PATH"

echo "📁 Working directory: $(pwd)"

# Download files directly from GitHub
echo "📥 Downloading backend files..."
curl -L https://github.com/teophat559/bvote-2025/archive/main.zip -o temp.zip
unzip -q temp.zip
cp -r bvote-2025-main/backend/* .
rm -rf bvote-2025-main temp.zip

echo "✅ Files downloaded"

# Create minimal package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "bvote-backend",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "dependencies": {
    "express": "latest",
    "cors": "latest",
    "helmet": "latest",
    "morgan": "latest",
    "compression": "latest",
    "express-rate-limit": "latest",
    "express-slow-down": "latest",
    "bcrypt": "latest",
    "jsonwebtoken": "latest",
    "dotenv": "latest",
    "winston": "latest",
    "socket.io": "latest",
    "pg": "latest",
    "sqlite3": "latest",
    "multer": "latest",
    "express-validator": "latest",
    "validator": "latest"
  }
}
EOF

# Create .env
echo "🔧 Creating environment config..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
ENABLE_TELEGRAM_NOTIFICATIONS=true
CORS_ORIGIN=https://votingonline2025.site,https://admin.votingonline2025.site
CORS_CREDENTIALS=true
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Start server
echo "🚀 Starting server..."
pm2 start server.js --name bvote-backend || node server.js &

echo "✅ Quick setup complete!"
echo "🔗 Test: curl http://localhost:3000/health"
