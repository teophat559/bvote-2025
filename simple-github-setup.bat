@echo off
echo ========================================
echo 🔐 BVOTE 2025 - Simple GitHub Setup
echo ========================================
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found!
    echo.
    echo 📦 Installing GitHub CLI using winget...

    REM Try winget installation
    winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements

    echo.
    echo ⏳ Waiting for installation to complete...
    timeout /t 10 >nul

    REM Check if installation worked
    where gh >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Automatic installation failed or GitHub CLI not in PATH yet.
        echo.
        echo 🔧 Please try one of these options:
        echo.
        echo Option 1 - Restart terminal and try again:
        echo   • Close this window
        echo   • Open new Command Prompt as Administrator
        echo   • Run this script again
        echo.
        echo Option 2 - Manual installation:
        echo   • Go to: https://cli.github.com/
        echo   • Download and install GitHub CLI
        echo   • Then run this script again
        echo.
        echo Option 3 - Use chocolatey:
        echo   • Run: choco install gh
        echo   • Then run this script again
        echo.
        echo Option 4 - Manual GitHub secrets setup:
        echo   • Go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
        echo   • Click "New repository secret"
        echo   • Name: SERVER_PASSWORD
        echo   • Value: 123123zz@
        echo   • Click "Add secret"
        echo.
        pause
        exit /b 1
    )
)

echo ✅ GitHub CLI found!
echo.

REM Check authentication
echo 🔐 Checking GitHub authentication...
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔑 Starting GitHub authentication...
    echo Please follow the prompts to authenticate with GitHub
    gh auth login
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Authentication failed!
        pause
        exit /b 1
    )
)

echo ✅ GitHub authenticated!
echo.

REM Add SERVER_PASSWORD secret
echo 🔐 Adding SERVER_PASSWORD secret...
echo 123123zz@ | gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025

if %ERRORLEVEL% EQU 0 (
    echo ✅ SERVER_PASSWORD secret added successfully!
) else (
    echo ❌ Failed to add secret. Please add manually:
    echo 1. Go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
    echo 2. Click "New repository secret"
    echo 3. Name: SERVER_PASSWORD
    echo 4. Value: 123123zz@
    echo 5. Click "Add secret"
)

echo.

REM Verify secrets
echo 🔍 Verifying secrets...
gh secret list --repo teophat559/bvote-2025

echo.

REM Ask to trigger deployment
set /p trigger="🚀 Trigger deployment now? (y/n): "
if /i "%trigger%"=="y" (
    echo 🚀 Triggering deployment...
    gh workflow run "simple-deploy.yml" --repo teophat559/bvote-2025
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Deployment triggered!
        echo 📊 View at: https://github.com/teophat559/bvote-2025/actions
    ) else (
        echo ❌ Failed to trigger deployment
    )
)

echo.
echo ========================================
echo 🎉 SETUP COMPLETED!
echo ========================================
echo.
echo 📋 What was configured:
echo • GitHub CLI authenticated
echo • SERVER_PASSWORD secret added
echo • Auto deployment enabled
echo.
echo 🌐 Your URLs (after deployment):
echo • Main: https://votingonline2025.site
echo • Admin: https://admin.votingonline2025.site
echo • API: https://api.votingonline2025.site
echo.
echo 📊 Monitor: https://github.com/teophat559/bvote-2025/actions
echo.
echo ✅ Every code push will now auto-deploy!
echo.
pause
