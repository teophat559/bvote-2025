# BVOTE 2025 - Simple PowerShell Deployment
Write-Host "========================================" -ForegroundColor Green
Write-Host "BVOTE 2025 - Auto Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$server = "85.31.224.8"
$username = "root"
$password = "123123zz@"
$domain = "votingonline2025.site"

Write-Host "Server: $server" -ForegroundColor Yellow
Write-Host "Domain: $domain" -ForegroundColor Yellow
Write-Host ""

# Check if SSH is available
$sshExists = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshExists) {
    Write-Host "SSH not found. Installing OpenSSH..." -ForegroundColor Red

    # Try to install OpenSSH
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
        Write-Host "OpenSSH installed. Please restart PowerShell." -ForegroundColor Green
        Read-Host "Press Enter to exit"
        exit
    }
    catch {
        Write-Host "Failed to install SSH automatically." -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual deployment instructions:" -ForegroundColor Yellow
        Write-Host "1. Install PuTTY from https://www.putty.org/" -ForegroundColor White
        Write-Host "2. Use PuTTY to connect to: $server" -ForegroundColor White
        Write-Host "3. Username: $username" -ForegroundColor White
        Write-Host "4. Password: $password" -ForegroundColor White
        Write-Host "5. Run this command:" -ForegroundColor White
        Write-Host "wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh" -ForegroundColor Cyan
        Read-Host "Press Enter to exit"
        exit
    }
}

Write-Host "SSH found. Attempting deployment..." -ForegroundColor Green

# Create deployment command
$deployUrl = "https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh"
$cmd = "wget $deployUrl; chmod +x deploy-votingonline2025.sh; ./deploy-votingonline2025.sh"

Write-Host "Connecting to server..." -ForegroundColor Yellow

# Try SSH connection
try {
    $result = ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no "$username@$server" $cmd

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your BVOTE 2025 URLs:" -ForegroundColor Yellow
        Write-Host "- Main Site: https://$domain" -ForegroundColor Cyan
        Write-Host "- Admin Panel: https://admin.$domain" -ForegroundColor Cyan
        Write-Host "- API Backend: https://api.$domain" -ForegroundColor Cyan
        Write-Host "- Health Check: https://api.$domain/health" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "SSH connection failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment:" -ForegroundColor Yellow
    Write-Host "1. ssh $username@$server" -ForegroundColor White
    Write-Host "2. Enter password: $password" -ForegroundColor White
    Write-Host "3. Run: $cmd" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Press Enter to exit"
