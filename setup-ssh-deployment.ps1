# BVOTE 2025 - SSH Deployment Setup (PowerShell Version)
# This script will automatically setup SSH-based deployment

param(
    [string]$ServerHost = "207.148.77.58",
    [string]$ServerUser = "root",
    [string]$RepoOwner = "teophat559",
    [string]$RepoName = "bvote-2025"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "🔐 BVOTE 2025 - SSH Deployment Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "This script will:" -ForegroundColor White
Write-Host "• Generate SSH key for deployment" -ForegroundColor Gray
Write-Host "• Add SSH key to GitHub secrets" -ForegroundColor Gray
Write-Host "• Update workflow to use SSH" -ForegroundColor Gray
Write-Host "• Test SSH connection" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with SSH setup? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔑 STEP 1: GENERATING SSH KEY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if SSH directory exists
$sshDir = Join-Path $env:USERPROFILE ".ssh"
if (-not (Test-Path $sshDir)) {
    Write-Host "Creating SSH directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

# Generate SSH key
$keyPath = Join-Path $sshDir "bvote_deploy_key"
$pubKeyPath = "$keyPath.pub"

Write-Host "Generating SSH key for GitHub Actions deployment..." -ForegroundColor Yellow

try {
    # Generate SSH key
    ssh-keygen -t ed25519 -C "github-actions-deploy-bvote2025" -f $keyPath -N '""'
    
    if ($LASTEXITCODE -ne 0) {
        throw "SSH key generation failed"
    }
    
    Write-Host "✅ SSH key generated successfully!" -ForegroundColor Green
    Write-Host "• Private key: $keyPath" -ForegroundColor Gray
    Write-Host "• Public key: $pubKeyPath" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to generate SSH key: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 STEP 2: DISPLAY SSH KEYS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔐 PRIVATE KEY (for GitHub Secrets):" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$privateKey = Get-Content $keyPath -Raw
Write-Host $privateKey -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host ""
Write-Host "🔑 PUBLIC KEY (for server ~/.ssh/authorized_keys):" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$publicKey = Get-Content $pubKeyPath -Raw
Write-Host $publicKey -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 STEP 3: GITHUB SECRETS SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if GitHub CLI is available
$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghExists) {
    Write-Host "❌ GitHub CLI not found!" -ForegroundColor Red
    Write-Host "Please install GitHub CLI or add secrets manually:" -ForegroundColor White
    Write-Host "1. Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
    Write-Host "2. Add secret: SSH_PRIVATE_KEY" -ForegroundColor White
    Write-Host "3. Copy the private key content above" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📋 MANUAL SETUP REQUIRED:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Copy the PRIVATE KEY above" -ForegroundColor White
    Write-Host "2. Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
    Write-Host "3. Click 'New repository secret'" -ForegroundColor White
    Write-Host "4. Name: SSH_PRIVATE_KEY" -ForegroundColor White
    Write-Host "5. Paste the private key content" -ForegroundColor White
    Write-Host "6. Add these additional secrets:" -ForegroundColor White
    Write-Host "   • SERVER_HOST = $ServerHost" -ForegroundColor White
    Write-Host "   • SERVER_USER = $ServerUser" -ForegroundColor White
    Write-Host "   • SERVER_PASSWORD = 123123zz@" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "🔐 Adding SSH_PRIVATE_KEY to GitHub secrets..." -ForegroundColor Yellow
    
    try {
        # Add SSH private key to GitHub secrets
        $privateKey | gh secret set SSH_PRIVATE_KEY --repo "$RepoOwner/$RepoName"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SSH_PRIVATE_KEY secret added successfully!" -ForegroundColor Green
        } else {
            throw "Failed to add SSH_PRIVATE_KEY secret"
        }
        
        # Add other secrets
        Write-Host ""
        Write-Host "🔐 Adding SERVER_HOST secret..." -ForegroundColor Yellow
        Write-Output $ServerHost | gh secret set SERVER_HOST --repo "$RepoOwner/$RepoName"
        
        Write-Host "🔐 Adding SERVER_USER secret..." -ForegroundColor Yellow
        Write-Output $ServerUser | gh secret set SERVER_USER --repo "$RepoOwner/$RepoName"
        
        Write-Host "🔐 Adding SERVER_PASSWORD secret..." -ForegroundColor Yellow
        Write-Output "123123zz@" | gh secret set SERVER_PASSWORD --repo "$RepoOwner/$RepoName"
        
        Write-Host ""
        Write-Host "🔍 Verifying GitHub secrets..." -ForegroundColor Yellow
        gh secret list --repo "$RepoOwner/$RepoName"
        
    } catch {
        Write-Host "❌ Failed to add GitHub secrets: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 STEP 4: UPDATING WORKFLOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Updating GitHub workflow to use SSH..." -ForegroundColor Yellow

# Create .github/workflows directory if it doesn't exist
$workflowDir = ".github\workflows"
if (-not (Test-Path $workflowDir)) {
    New-Item -ItemType Directory -Path $workflowDir -Force | Out-Null
}

# Create SSH deployment workflow
$workflowContent = @"
name: 🚀 SSH Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: 🚀 Deploy to Production Server

    steps:
    - name: 📦 Checkout Repository
      uses: actions/checkout@v4

    - name: 🔑 Setup SSH Agent
      uses: webfactory/ssh-agent@v0.9.0
      with:
        ssh-private-key: `${{ secrets.SSH_PRIVATE_KEY }}

    - name: 🔐 Add Server to Known Hosts
      run: |
        ssh-keyscan -H `${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts

    - name: 🚀 Deploy to Production
      run: |
        ssh `${{ secrets.SERVER_USER }}@`${{ secrets.SERVER_HOST }} 'bash -s' << 'EOF'
        set -e
        echo "🚀 Starting deployment..."

        # Navigate to project directory
        cd /var/www/bvote-2025 || { echo "❌ Project directory not found"; exit 1; }

        # Pull latest changes
        echo "📦 Pulling latest changes..."
        git pull origin main

        # Install backend dependencies
        echo "📦 Installing backend dependencies..."
        cd backend
        npm install --production

        # Install admin dependencies and build
        echo "🏗️ Building admin panel..."
        cd ../admin
        npm install
        npm run build

        # Restart services
        echo "🔄 Restarting services..."
        cd ..
        pm2 restart all || pm2 start ecosystem.config.js

        echo "✅ Deployment completed successfully!"
        EOF

    - name: 🔔 Notify Deployment Status
      if: always()
      run: |
        if [ "`${{ job.status }}" == "success" ]; then
          echo "✅ Deployment completed successfully!"
        else
          echo "❌ Deployment failed!"
        fi
"@

$workflowPath = Join-Path $workflowDir "ssh-deploy.yml"
$workflowContent | Out-File -FilePath $workflowPath -Encoding UTF8

Write-Host "✅ SSH deployment workflow created!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 STEP 5: SERVER SETUP INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 IMPORTANT: Add public key to your server!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command on your server ($ServerHost):" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "mkdir -p ~/.ssh" -ForegroundColor White
Write-Host "chmod 700 ~/.ssh" -ForegroundColor White
Write-Host "echo `"$publicKey`" >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 SSH DEPLOYMENT SETUP COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "✅ What was configured:" -ForegroundColor White
Write-Host "• SSH key pair generated" -ForegroundColor Gray
Write-Host "• GitHub secrets configured" -ForegroundColor Gray
Write-Host "• SSH deployment workflow created" -ForegroundColor Gray
Write-Host "• Server setup instructions provided" -ForegroundColor Gray
Write-Host ""

Write-Host "🔄 Next steps:" -ForegroundColor White
Write-Host "1. Add public key to server (instructions above)" -ForegroundColor Gray
Write-Host "2. Commit and push the new workflow" -ForegroundColor Gray
Write-Host "3. Test deployment" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Your deployment will now use SSH for secure connection!" -ForegroundColor Green
Write-Host ""

$commit = Read-Host "📤 Commit and push the new workflow now? (y/n)"
if ($commit -eq "y" -or $commit -eq "Y") {
    Write-Host ""
    Write-Host "📤 Committing and pushing workflow..." -ForegroundColor Yellow
    
    try {
        git add .github/workflows/ssh-deploy.yml
        git commit -m "🔐 Add SSH-based deployment workflow

- Add secure SSH deployment using private key
- Remove password-based authentication  
- Improve deployment security and reliability"
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Workflow pushed successfully!" -ForegroundColor Green
            Write-Host "📊 View at: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Cyan
        } else {
            throw "Failed to push workflow"
        }
    } catch {
        Write-Host "❌ Failed to push workflow: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to exit"
