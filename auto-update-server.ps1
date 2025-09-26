# BVOTE 2025 - Auto Update Server (PowerShell Version)
# This script will automatically add SSH public key to server

param(
    [string]$ServerHost = "207.148.77.58",
    [string]$ServerUser = "root",
    [string]$ServerPassword = "123123zz@"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 BVOTE 2025 - Auto Update Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "This will automatically add SSH public key to server" -ForegroundColor White
Write-Host "Server: $ServerHost" -ForegroundColor Gray
Write-Host "User: $ServerUser" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with server update? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Update cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔐 Connecting to server and updating SSH keys..." -ForegroundColor Yellow
Write-Host ""

# SSH public key
$publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH2T4ZIfar298K3rrVJJSXfAplkEpjGvuRcvxofTKGno github-actions-bvote2025"

# Create server setup commands
$setupCommands = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$publicKey" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH key added successfully!"
"@

try {
    Write-Host "📤 Executing setup commands on server..." -ForegroundColor Cyan

    # Method 1: Try using SSH with password (if available)
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "Using SSH to connect..." -ForegroundColor White

        # Create temporary script file
        $tempScript = "temp_server_setup.sh"
        $setupCommands | Out-File -FilePath $tempScript -Encoding ASCII

        # Upload and execute script
        scp -o StrictHostKeyChecking=no $tempScript "$ServerUser@$ServerHost":/tmp/
        ssh -o StrictHostKeyChecking=no "$ServerUser@$ServerHost" "chmod +x /tmp/$tempScript && /tmp/$tempScript && rm /tmp/$tempScript"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Server updated successfully!" -ForegroundColor Green

            Write-Host ""
            Write-Host "🚀 Testing SSH connection..." -ForegroundColor Yellow
            ssh -o StrictHostKeyChecking=no "$ServerUser@$ServerHost" "echo 'SSH connection test successful!'"

            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ SSH connection working!" -ForegroundColor Green

                Write-Host ""
                Write-Host "🔄 Triggering new deployment to test..." -ForegroundColor Yellow
                git commit --allow-empty -m "🚀 Test deployment after server SSH setup"
                git push origin main

                Write-Host ""
                Write-Host "✅ Deployment triggered!" -ForegroundColor Green
                Write-Host "📊 Monitor at: https://github.com/teophat559/bvote-2025/actions" -ForegroundColor Cyan
            }
            else {
                Write-Host "❌ SSH connection test failed" -ForegroundColor Red
            }
        }
        else {
            throw "Failed to execute commands on server"
        }

        # Clean up
        if (Test-Path $tempScript) {
            Remove-Item $tempScript -Force
        }
    }
    else {
        throw "SSH command not found"
    }
}
catch {
    Write-Host "❌ Automatic update failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 MANUAL METHOD:" -ForegroundColor Yellow
    Write-Host "1. SSH to server: ssh $ServerUser@$ServerHost" -ForegroundColor White
    Write-Host "2. Run these commands:" -ForegroundColor White
    Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "   echo `"$publicKey`" >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔑 Or use PuTTY/WinSCP with these credentials:" -ForegroundColor Yellow
    Write-Host "   Host: $ServerHost" -ForegroundColor White
    Write-Host "   User: $ServerUser" -ForegroundColor White
    Write-Host "   Password: $ServerPassword" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 AUTO UPDATE COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
