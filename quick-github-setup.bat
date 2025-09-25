@echo off
echo ========================================
echo 🔐 BVOTE 2025 - Quick GitHub Setup
echo ========================================
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub CLI not found!
    echo.
    echo Installing GitHub CLI...
<<<<<<< HEAD
<<<<<<< Updated upstream
    
=======

>>>>>>> Stashed changes
=======
    
>>>>>>> origin/main
    REM Try winget first
    where winget >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📦 Installing via winget...
<<<<<<< HEAD
<<<<<<< Updated upstream
        winget install --id GitHub.cli
=======
        winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
        timeout /t 3 >nul
        REM Check if installation was successful
        where gh >nul 2>nul
>>>>>>> Stashed changes
=======
        winget install --id GitHub.cli
>>>>>>> origin/main
        if %ERRORLEVEL% EQU 0 (
            echo ✅ GitHub CLI installed successfully!
            echo Please restart this script.
            pause
            exit /b 0
<<<<<<< HEAD
<<<<<<< Updated upstream
        )
    )
    
=======
        ) else (
            echo ⚠️ Winget installation may need time to update PATH
        )
    )

>>>>>>> Stashed changes
=======
        )
    )
    
>>>>>>> origin/main
    REM Try chocolatey
    where choco >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo 📦 Installing via chocolatey...
        choco install gh -y
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
        timeout /t 3 >nul
        REM Refresh environment variables
        call refreshenv >nul 2>nul
        REM Check if installation was successful
        where gh >nul 2>nul
>>>>>>> Stashed changes
=======
>>>>>>> origin/main
        if %ERRORLEVEL% EQU 0 (
            echo ✅ GitHub CLI installed successfully!
            echo Please restart this script.
            pause
            exit /b 0
<<<<<<< HEAD
<<<<<<< Updated upstream
        )
    )
    
=======
        ) else (
            echo ⚠️ Chocolatey installation may need terminal restart
        )
    )

    REM Try direct download method
    echo 📦 Trying direct download method...
    powershell -Command "try { $url = 'https://github.com/cli/cli/releases/latest/download/gh_windows_amd64.msi'; $output = Join-Path $env:TEMP 'gh_installer.msi'; Write-Host 'Downloading GitHub CLI installer...'; Invoke-WebRequest -Uri $url -OutFile $output; Write-Host 'Installing GitHub CLI...'; Start-Process msiexec -ArgumentList '/i', $output, '/quiet', '/norestart' -Wait; Remove-Item $output -Force; Write-Host 'Installation completed. Please restart this script.'; } catch { Write-Host 'Direct download failed:' $_.Exception.Message; }"
    timeout /t 5 >nul
    REM Check if installation was successful after direct download
    where gh >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ GitHub CLI installed successfully!
        echo Please restart this script.
        pause
        exit /b 0
    )

>>>>>>> Stashed changes
=======
        )
    )
    
>>>>>>> origin/main
    echo ❌ Automatic installation failed.
    echo.
    echo Manual setup required:
    echo 1. Install GitHub CLI from: https://cli.github.com/
    echo 2. Or setup manually at: https://github.com/teophat559/bvote-2025/settings/secrets/actions
    echo 3. Add secret: SERVER_PASSWORD = 123123zz@
    echo.
    pause
    exit /b 1
)

echo ✅ GitHub CLI found!
echo.

REM Check authentication
echo 🔐 Checking GitHub authentication...
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔑 Starting GitHub authentication...
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
