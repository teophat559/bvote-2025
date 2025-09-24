#!/bin/bash

# VPS QUICK FIX SCRIPT - votingonline2025.site
echo "🛠️ VPS QUICK FIX - votingonline2025.site"
echo "========================================"

# Stop any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node.*server.js" || true
pkill -f "npm.*start" || true

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "🔄 Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm install --production

# Create missing directories
echo "📁 Creating directories..."
mkdir -p logs uploads scripts

# Create ecosystem.config.js if missing
if [ ! -f "ecosystem.config.js" ]; then
    echo "⚙️ Creating PM2 ecosystem config..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'bvote-backend',
      script: 'backend/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF
fi

# Fix environment file
if [ ! -f ".env.production" ]; then
    echo "🔧 Creating .env.production..."
    cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=mysql://voti_voting_user:123123zz@localhost:3306/voti_voting_secure_2025
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voti_voting_secure_2025
DB_USER=voti_voting_user
DB_PASSWORD=123123zz@
DB_FALLBACK=true

JWT_SECRET=VPS_SECURE_JWT_SECRET_2025_PRODUCTION_VOTINGONLINE
JWT_EXPIRES_IN=24h

TELEGRAM_BOT_TOKEN=7001751139:AAFCC83DPRn1larWNjd_ms9xvY9rl0KJlGE
TELEGRAM_CHAT_ID=6936181519
ENABLE_TELEGRAM_ALERTS=true

CORS_ORIGIN=https://votingonline2025.site,http://votingonline2025.site
EOF
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Quick fix completed!"
echo ""
echo "🧪 Test the server:"
echo "curl http://localhost:3000/api/health"
echo ""
echo "📋 Monitor logs:"
echo "pm2 logs bvote-backend"
