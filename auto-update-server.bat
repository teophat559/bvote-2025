@echo off
echo ========================================
echo 🚀 BVOTE 2025 - Auto Update Server
echo ========================================
echo.
echo This will automatically add SSH public key to server
echo Server: 207.148.77.58
echo User: root
echo.

set /p confirm="Continue with server update? (y/n): "
if /i not "%confirm%"=="y" (
    echo Update cancelled.
    pause
    exit /b 0
)

echo.
echo 🔐 Connecting to server and updating SSH keys...
echo.

REM Create temporary script file
echo mkdir -p ~/.ssh > temp_server_setup.sh
echo chmod 700 ~/.ssh >> temp_server_setup.sh
echo echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025" ^>^> ~/.ssh/authorized_keys >> temp_server_setup.sh
echo chmod 600 ~/.ssh/authorized_keys >> temp_server_setup.sh
echo echo "✅ SSH key added successfully!" >> temp_server_setup.sh

echo 📤 Uploading and executing setup script on server...

REM Use scp to upload script and ssh to execute
scp -o StrictHostKeyChecking=no temp_server_setup.sh root@207.148.77.58:/tmp/
ssh -o StrictHostKeyChecking=no root@207.148.77.58 "chmod +x /tmp/temp_server_setup.sh && /tmp/temp_server_setup.sh && rm /tmp/temp_server_setup.sh"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Server updated successfully!
    echo.
    echo 🚀 Now testing SSH connection...
    ssh -o StrictHostKeyChecking=no root@207.148.77.58 "echo 'SSH connection test successful!'"

    if %ERRORLEVEL% EQU 0 (
        echo ✅ SSH connection working!
        echo.
        echo 🔄 Triggering new deployment to test...
        git commit --allow-empty -m "🚀 Test deployment after server SSH setup"
        git push origin main

        echo.
        echo ✅ Deployment triggered!
        echo 📊 Monitor at: https://github.com/teophat559/bvote-2025/actions
    ) else (
        echo ❌ SSH connection test failed
    )
) else (
    echo ❌ Failed to update server
    echo.
    echo Manual method:
    echo 1. SSH to server: ssh root@207.148.77.58
    echo 2. Run these commands:
    echo    mkdir -p ~/.ssh
    echo    chmod 700 ~/.ssh
    echo    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025" ^>^> ~/.ssh/authorized_keys
    echo    chmod 600 ~/.ssh/authorized_keys
)

REM Clean up
if exist temp_server_setup.sh del temp_server_setup.sh

echo.
echo ========================================
echo 🎉 AUTO UPDATE COMPLETED!
echo ========================================
echo.
pause
