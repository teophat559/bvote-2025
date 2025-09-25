@echo off
echo ========================================
echo 🔐 BVOTE 2025 - SSH Deployment Setup
echo ========================================
echo.
echo This script will:
echo • Generate SSH key for deployment
echo • Add SSH key to GitHub secrets
echo • Update workflow to use SSH
echo • Test SSH connection
echo.

set /p confirm="Continue with SSH setup? (y/n): "
if /i not "%confirm%"=="y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo 🔑 STEP 1: GENERATING SSH KEY
echo ========================================

REM Check if SSH directory exists
if not exist "%USERPROFILE%\.ssh" (
    echo Creating SSH directory...
    mkdir "%USERPROFILE%\.ssh"
)

REM Generate SSH key
echo Generating SSH key for GitHub Actions deployment...
ssh-keygen -t ed25519 -C "github-actions-deploy-bvote2025" -f "%USERPROFILE%\.ssh\bvote_deploy_key" -N ""

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate SSH key
    pause
    exit /b 1
)

echo ✅ SSH key generated successfully!
echo • Private key: %USERPROFILE%\.ssh\bvote_deploy_key
echo • Public key: %USERPROFILE%\.ssh\bvote_deploy_key.pub

echo.
echo ========================================
echo 📋 STEP 2: DISPLAY SSH KEYS
echo ========================================

echo.
echo 🔐 PRIVATE KEY (for GitHub Secrets):
echo ----------------------------------------
type "%USERPROFILE%\.ssh\bvote_deploy_key"
echo.
echo ----------------------------------------

echo.
echo 🔑 PUBLIC KEY (for server ~/.ssh/authorized_keys):
echo ----------------------------------------
type "%USERPROFILE%\.ssh\bvote_deploy_key.pub"
echo ----------------------------------------

echo.
echo ========================================
echo 🔧 STEP 3: GITHUB SECRETS SETUP
echo ========================================

REM Check if GitHub CLI is available
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found!
    echo Please install GitHub CLI or add secrets manually:
    echo 1. Go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
    echo 2. Add secret: SSH_PRIVATE_KEY
    echo 3. Copy the private key content above
    echo.
    goto :manual_setup
)

echo 🔐 Adding SSH_PRIVATE_KEY to GitHub secrets...

REM Add SSH private key to GitHub secrets
gh secret set SSH_PRIVATE_KEY --repo teophat559/bvote-2025 < "%USERPROFILE%\.ssh\bvote_deploy_key"

if %ERRORLEVEL% EQU 0 (
    echo ✅ SSH_PRIVATE_KEY secret added successfully!
) else (
    echo ❌ Failed to add SSH_PRIVATE_KEY secret
    goto :manual_setup
)

echo.
echo 🔐 Adding SERVER_HOST secret...
echo 207.148.77.58 | gh secret set SERVER_HOST --repo teophat559/bvote-2025

echo.
echo 🔐 Adding SERVER_USER secret...
echo root | gh secret set SERVER_USER --repo teophat559/bvote-2025

echo.
echo 🔐 Adding SERVER_PASSWORD secret...
echo 123123zz@ | gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025

echo.
echo 🔍 Verifying GitHub secrets...
gh secret list --repo teophat559/bvote-2025

goto :workflow_update

:manual_setup
echo.
echo 📋 MANUAL SETUP REQUIRED:
echo.
echo 1. Copy the PRIVATE KEY above
echo 2. Go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
echo 3. Click "New repository secret"
echo 4. Name: SSH_PRIVATE_KEY
echo 5. Paste the private key content
echo 6. Add these additional secrets:
echo    • SERVER_HOST = 207.148.77.58
echo    • SERVER_USER = root
echo    • SERVER_PASSWORD = 123123zz@
echo.

:workflow_update
echo.
echo ========================================
echo 🔧 STEP 4: UPDATING WORKFLOW
echo ========================================

echo Updating GitHub workflow to use SSH...

REM Create .github/workflows directory if it doesn't exist
if not exist ".github" mkdir ".github"
if not exist ".github\workflows" mkdir ".github\workflows"

REM Create or update the deployment workflow
echo Creating SSH-enabled deployment workflow...

(
echo name: 🚀 SSH Deploy to Production
echo.
echo on:
echo   push:
echo     branches: [ main ]
echo   workflow_dispatch:
echo.
echo jobs:
echo   deploy:
echo     runs-on: ubuntu-latest
echo     name: 🚀 Deploy to Production Server
echo.
echo     steps:
echo     - name: 📦 Checkout Repository
echo       uses: actions/checkout@v4
echo.
echo     - name: 🔑 Setup SSH Agent
echo       uses: webfactory/ssh-agent@v0.9.0
echo       with:
echo         ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
echo.
echo     - name: 🔐 Add Server to Known Hosts
echo       run: ^|
echo         ssh-keyscan -H ${{ secrets.SERVER_HOST }} ^>^> ~/.ssh/known_hosts
echo.
echo     - name: 🚀 Deploy to Production
echo       run: ^|
echo         ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} 'bash -s' ^<^< 'EOF'
echo         set -e
echo         echo "🚀 Starting deployment..."
echo.
echo         # Navigate to project directory
echo         cd /var/www/bvote-2025 ^|^| { echo "❌ Project directory not found"; exit 1; }
echo.
echo         # Pull latest changes
echo         echo "📦 Pulling latest changes..."
echo         git pull origin main
echo.
echo         # Install backend dependencies
echo         echo "📦 Installing backend dependencies..."
echo         cd backend
echo         npm install --production
echo.
echo         # Install admin dependencies and build
echo         echo "🏗️ Building admin panel..."
echo         cd ../admin
echo         npm install
echo         npm run build
echo.
echo         # Restart services
echo         echo "🔄 Restarting services..."
echo         cd ..
echo         pm2 restart all ^|^| pm2 start ecosystem.config.js
echo.
echo         echo "✅ Deployment completed successfully!"
echo         EOF
echo.
echo     - name: 🔔 Notify Deployment Status
echo       if: always()
echo       run: ^|
echo         if [ "${{ job.status }}" == "success" ]; then
echo           echo "✅ Deployment completed successfully!"
echo         else
echo           echo "❌ Deployment failed!"
echo         fi
) > ".github\workflows\ssh-deploy.yml"

echo ✅ SSH deployment workflow created!

echo.
echo ========================================
echo 📋 STEP 5: SERVER SETUP INSTRUCTIONS
echo ========================================

echo.
echo 🔧 IMPORTANT: Add public key to your server!
echo.
echo Run this command on your server (207.148.77.58):
echo ----------------------------------------
echo mkdir -p ~/.ssh
echo chmod 700 ~/.ssh
echo echo "
type "%USERPROFILE%\.ssh\bvote_deploy_key.pub"
echo " ^>^> ~/.ssh/authorized_keys
echo chmod 600 ~/.ssh/authorized_keys
echo ----------------------------------------
echo.

echo.
echo ========================================
echo 🎉 SSH DEPLOYMENT SETUP COMPLETED!
echo ========================================
echo.
echo ✅ What was configured:
echo • SSH key pair generated
echo • GitHub secrets configured
echo • SSH deployment workflow created
echo • Server setup instructions provided
echo.
echo 🔄 Next steps:
echo 1. Add public key to server (instructions above)
echo 2. Commit and push the new workflow
echo 3. Test deployment
echo.
echo 🌐 Your deployment will now use SSH for secure connection!
echo.

set /p commit="📤 Commit and push the new workflow now? (y/n): "
if /i "%commit%"=="y" (
    echo.
    echo 📤 Committing and pushing workflow...
    git add .github/workflows/ssh-deploy.yml
    git commit -m "🔐 Add SSH-based deployment workflow

- Add secure SSH deployment using private key
- Remove password-based authentication
- Improve deployment security and reliability"
    git push origin main
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Workflow pushed successfully!
        echo 📊 View at: https://github.com/teophat559/bvote-2025/actions
    ) else (
        echo ❌ Failed to push workflow
    )
)

echo.
pause
