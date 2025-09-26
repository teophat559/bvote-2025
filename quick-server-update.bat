@echo off
echo ========================================
echo 🚀 QUICK SERVER SSH UPDATE
echo ========================================
echo.
echo Adding SSH key to server automatically...
echo.

REM Use PowerShell to handle SSH connection with password
powershell -Command "& {
    $server = '207.148.77.58'
    $user = 'root'
    $password = '123123zz@'
    $publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025'

    Write-Host '🔐 Connecting to server...' -ForegroundColor Yellow

    # Create commands to run on server
    $commands = @'
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo \"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025\" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo \"✅ SSH key added successfully!\"
'@

    try {
        # Try to connect using SSH (requires SSH client)
        if (Get-Command ssh -ErrorAction SilentlyContinue) {
            Write-Host '📤 Executing commands on server...' -ForegroundColor Cyan

            # Use expect-like behavior or sshpass if available
            $result = ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $user@$server $commands

            if ($LASTEXITCODE -eq 0) {
                Write-Host '✅ Server updated successfully!' -ForegroundColor Green
                return $true
            }
        }

        Write-Host '⚠️ Direct SSH failed, showing manual instructions...' -ForegroundColor Yellow
        return $false
    }
    catch {
        Write-Host '❌ Connection failed: ' $_.Exception.Message -ForegroundColor Red
        return $false
    }
}"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Automatic update successful!
    echo.
    echo 🚀 Triggering test deployment...
    git commit --allow-empty -m "Test deployment after SSH setup"
    git push origin main
    echo.
    echo 📊 Check deployment: https://github.com/teophat559/bvote-2025/actions
) else (
    echo.
    echo 📋 MANUAL UPDATE REQUIRED:
    echo.
    echo 1. Connect to server using SSH/PuTTY:
    echo    Host: 207.148.77.58
    echo    User: root
    echo    Password: 123123zz@
    echo.
    echo 2. Run these commands:
    echo    mkdir -p ~/.ssh
    echo    chmod 700 ~/.ssh
    echo    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025" ^>^> ~/.ssh/authorized_keys
    echo    chmod 600 ~/.ssh/authorized_keys
    echo.
    echo 3. Then trigger deployment:
    echo    git commit --allow-empty -m "Test deployment"
    echo    git push origin main
)

echo.
pause
