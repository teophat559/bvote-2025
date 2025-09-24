# Windows PowerShell Deployment Script
# VotingOnline2025 Production Deployment

Write-Host "🚀 Starting VPS Production Deployment (Windows)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Yellow

$VPS_HOST = "85.31.224.8"
$VPS_USER = "root"
$DOMAIN = "votingonline2025.site"

Write-Host "🌐 Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "📡 VPS: $VPS_HOST" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue

# Create tar.gz file (requires Git Bash)
$process = Start-Process -FilePath "C:\Program Files\Git\bin\bash.exe" -ArgumentList "-c", "tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf deployment.tar.gz ." -Wait -PassThru -NoNewWindow

if ($process.ExitCode -eq 0) {
    Write-Host "✅ Deployment package created" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to create deployment package" -ForegroundColor Red
    exit 1
}

# Step 2: Upload to VPS
Write-Host "📤 Uploading to VPS..." -ForegroundColor Blue
Write-Host "⚠️ You'll need to enter SSH password: 123123zz@" -ForegroundColor Yellow

# Use scp via Git Bash
$scp_process = Start-Process -FilePath "C:\Program Files\Git\bin\bash.exe" -ArgumentList "-c", "scp -o StrictHostKeyChecking=no deployment.tar.gz $VPS_USER@${VPS_HOST}:/tmp/" -Wait -PassThru

if ($scp_process.ExitCode -eq 0) {
    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    exit 1
}

# Step 3: Execute deployment on VPS
Write-Host "🔧 Executing deployment on VPS..." -ForegroundColor Blue
Write-Host "⚠️ You'll need to enter SSH password again: 123123zz@" -ForegroundColor Yellow

# SSH commands for deployment
$ssh_commands = @"
cd /home/votingonline2025.site/public_html

# Backup existing if exists
if [ -d 'current' ]; then
    mv current backup_`$(date +%Y%m%d_%H%M%S) || true
fi

# Extract new deployment
tar -xzf /tmp/deployment.tar.gz -C .

# Install dependencies
npm install --production

# Build frontend applications
cd admin && npm install && npm run build && cd ..
cd user && npm install && npm run build && cd ..

# Create production environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
ADMIN_PORT=3001
DOMAIN=votingonline2025.site
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=voti_voting_secure_2025
DATABASE_USER=voti_voting_user
DATABASE_PASSWORD=123123zz@
DB_HOST=localhost
DB_PORT=3306
DB_NAME=voti_voting_secure_2025
DB_USER=voti_voting_user
DB_PASSWORD=123123zz@
ADMIN_HISTORY_TABLE=admin_history_logs
JWT_SECRET=VotingOnline2025_ProductionJWT_SecureKey_2025@VPS
SESSION_SECRET=VotingOnline2025_SessionSecret_Production_2025@
UPLOAD_DIR=/home/votingonline2025.site/uploads
DATA_DIR=/home/votingonline2025.site/data
LOGS_DIR=/home/votingonline2025.site/logs
CHROME_MAX_INSTANCES=10
CHROME_HEADLESS=true
CHROME_NO_SANDBOX=true
MAX_CONCURRENT_OPERATIONS=20
SESSION_TIMEOUT=3600000
RATE_LIMIT_REQUESTS=100
ENABLE_SYNC=true
ENABLE_REALTIME_LOGGING=true
ENABLE_TELEGRAM_NOTIFICATIONS=true
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP=true
TRUST_PROXY=true
SECURE_COOKIES=true
API_RATE_LIMIT=100
ADMIN_RATE_LIMIT=200
HEALTH_CHECK_INTERVAL=60000
EOF

# Setup static files
mkdir -p static
cp -r user/dist/* ./
mkdir -p admin
cp -r admin/dist/* admin/

# Stop existing PM2 processes
pm2 delete all || true

# Start applications with PM2
pm2 start production/ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Deployment completed successfully!"
echo "🌐 Website: https://votingonline2025.site"
echo "📊 Admin: https://votingonline2025.site/admin"
"@

# Execute SSH commands
$ssh_process = Start-Process -FilePath "C:\Program Files\Git\bin\bash.exe" -ArgumentList "-c", "ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST '$ssh_commands'" -Wait -PassThru

if ($ssh_process.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Your application is now available at:" -ForegroundColor Cyan
    Write-Host "   Main Site: https://$DOMAIN" -ForegroundColor White
    Write-Host "   Admin Panel: https://$DOMAIN/admin" -ForegroundColor White
    Write-Host "   API Health: https://$DOMAIN/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 Admin Credentials:" -ForegroundColor Cyan
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: AdminVoting2025@Secure!" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Production deployment ready!" -ForegroundColor Green
}
else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item "deployment.tar.gz" -Force -ErrorAction SilentlyContinue
Write-Host "🧹 Cleanup completed" -ForegroundColor Gray
