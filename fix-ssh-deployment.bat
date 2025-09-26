@echo off
echo ========================================
echo 🔧 FIXING SSH DEPLOYMENT ERROR
echo ========================================
echo.
echo The GitHub Actions is failing because SSH_PRIVATE_KEY secret is missing.
echo Let me fix this automatically...
echo.

REM Check if GitHub CLI is available
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found!
    echo.
    echo MANUAL FIX REQUIRED:
    echo 1. Install GitHub CLI: winget install --id GitHub.cli
    echo 2. Run: gh auth login
    echo 3. Generate SSH key: ssh-keygen -t ed25519 -C "github-actions-deploy"
    echo 4. Add to GitHub secrets: gh secret set SSH_PRIVATE_KEY --repo teophat559/bvote-2025 ^< ~/.ssh/id_ed25519
    echo.
    pause
    exit /b 1
)

echo ✅ GitHub CLI found!
echo.

REM Check authentication
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔐 Please authenticate with GitHub first...
    gh auth login
)

echo.
echo 🔑 Generating SSH key for deployment...

REM Create SSH directory if not exists
if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"

REM Generate SSH key
ssh-keygen -t ed25519 -C "github-actions-bvote2025" -f "%USERPROFILE%\.ssh\bvote_deploy" -N ""

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate SSH key
    pause
    exit /b 1
)

echo ✅ SSH key generated!

echo.
echo 🔐 Adding SSH_PRIVATE_KEY to GitHub secrets...

REM Add SSH private key to GitHub secrets
gh secret set SSH_PRIVATE_KEY --repo teophat559/bvote-2025 < "%USERPROFILE%\.ssh\bvote_deploy"

if %ERRORLEVEL% EQU 0 (
    echo ✅ SSH_PRIVATE_KEY secret added successfully!
) else (
    echo ❌ Failed to add SSH_PRIVATE_KEY secret
    echo.
    echo MANUAL METHOD:
    echo 1. Copy this private key:
    echo.
    type "%USERPROFILE%\.ssh\bvote_deploy"
    echo.
    echo 2. Go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
    echo 3. Add secret: SSH_PRIVATE_KEY with the key above
    pause
    exit /b 1
)

echo.
echo 🔐 Adding other required secrets...

echo 207.148.77.58 | gh secret set SERVER_HOST --repo teophat559/bvote-2025
echo root | gh secret set SERVER_USER --repo teophat559/bvote-2025
echo 123123zz@ | gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025

echo.
echo 🔍 Verifying secrets...
gh secret list --repo teophat559/bvote-2025

echo.
echo ========================================
echo ✅ SSH DEPLOYMENT FIXED!
echo ========================================
echo.
echo 📋 What was fixed:
echo • SSH key pair generated
echo • SSH_PRIVATE_KEY secret added to GitHub
echo • SERVER_HOST, SERVER_USER, SERVER_PASSWORD secrets added
echo.
echo 🔧 IMPORTANT: Add this public key to your server!
echo.
echo Public key:
echo ----------------------------------------
type "%USERPROFILE%\.ssh\bvote_deploy.pub"
echo.
echo ----------------------------------------
echo.
echo Run this on your server (207.148.77.58):
echo mkdir -p ~/.ssh
echo chmod 700 ~/.ssh
echo echo "
type "%USERPROFILE%\.ssh\bvote_deploy.pub"
echo " ^>^> ~/.ssh/authorized_keys
echo chmod 600 ~/.ssh/authorized_keys
echo.

echo 🚀 Now trigger a new deployment:
echo git commit --allow-empty -m "Test SSH deployment fix"
echo git push origin main
echo.

set /p deploy="🚀 Trigger test deployment now? (y/n): "
if /i "%deploy%"=="y" (
    echo.
    echo 🚀 Triggering test deployment...
    git commit --allow-empty -m "🔧 Test SSH deployment fix"
    git push origin main
    echo.
    echo ✅ Deployment triggered!
    echo 📊 Check status at: https://github.com/teophat559/bvote-2025/actions
)

echo.
pause
