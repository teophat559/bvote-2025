@echo off
echo ========================================
echo 🚀 UPDATING SERVER SSH KEY
echo ========================================
echo.
echo Server: 207.148.77.58
echo Adding SSH public key automatically...
echo.

REM Try direct SSH connection with password authentication
echo 🔐 Attempting SSH connection...

REM Method 1: Try with SSH if available
where ssh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 📤 Using SSH client...

    REM Create temporary expect-like script
    echo spawn ssh -o StrictHostKeyChecking=no root@207.148.77.58 > temp_ssh.exp
    echo expect "password:" >> temp_ssh.exp
    echo send "123123zz@\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "mkdir -p ~/.ssh\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "chmod 700 ~/.ssh\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025' ^>^> ~/.ssh/authorized_keys\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "chmod 600 ~/.ssh/authorized_keys\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "echo 'SSH key added successfully!'\r" >> temp_ssh.exp
    echo expect "# " >> temp_ssh.exp
    echo send "exit\r" >> temp_ssh.exp
    echo interact >> temp_ssh.exp

    REM Try to run with expect if available
    where expect >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        expect temp_ssh.exp
        if %ERRORLEVEL% EQU 0 (
            echo ✅ SSH key added successfully!
            goto :success
        )
    )

    REM Clean up
    if exist temp_ssh.exp del temp_ssh.exp
)

REM If automatic methods fail, show manual instructions
echo ⚠️ Automatic SSH connection not available.
echo.
echo 📋 MANUAL UPDATE INSTRUCTIONS:
echo.
echo 1. 🔐 Connect to server using one of these methods:
echo.
echo    Method A - SSH Client:
echo    ssh root@207.148.77.58
echo    Password: 123123zz@
echo.
echo    Method B - PuTTY:
echo    Host: 207.148.77.58
echo    User: root
echo    Password: 123123zz@
echo.
echo 2. 📝 Run these commands on the server:
echo.
echo    mkdir -p ~/.ssh
echo    chmod 700 ~/.ssh
echo    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025" ^>^> ~/.ssh/authorized_keys
echo    chmod 600 ~/.ssh/authorized_keys
echo.
echo 3. 🚀 After adding the key, trigger deployment:
echo.

:manual_deploy
echo    git commit --allow-empty -m "Test SSH deployment"
echo    git push origin main
echo.
echo 📊 Then monitor at: https://github.com/teophat559/bvote-2025/actions
echo.
goto :end

:success
echo.
echo 🚀 Triggering test deployment...
git commit --allow-empty -m "🔧 Test SSH deployment after server update"
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment triggered successfully!
    echo 📊 Monitor at: https://github.com/teophat559/bvote-2025/actions
) else (
    echo ⚠️ Deployment trigger failed, but SSH key should be working
)

:end
echo.
echo ========================================
echo 🎉 SERVER UPDATE PROCESS COMPLETED
echo ========================================
echo.
echo Next steps:
echo • Monitor GitHub Actions for deployment status
echo • Check websites after deployment completes
echo • SSH key is now configured for secure deployment
echo.
pause
