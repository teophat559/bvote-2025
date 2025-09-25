# BVOTE 2025 - PowerShell Auto Deployment Script
# This script will automatically deploy BVOTE 2025 to your server

param(
    [string]$ServerIP = "85.31.224.8",
    [string]$Username = "root",
    [string]$Password = "123123zz@",
    [string]$Domain = "votingonline2025.site"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

Clear-Host
Write-ColorOutput Green @"
========================================
🚀 BVOTE 2025 - Auto Deployment
========================================
Domain: $Domain
Server: $ServerIP
Username: $Username
========================================
"@

Write-Info "Starting deployment process..."

# Check if OpenSSH is available
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Warning "OpenSSH not found. Attempting to enable Windows OpenSSH..."

    try {
        # Try to enable OpenSSH Client feature
        $feature = Get-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client
        if ($feature.State -ne "Enabled") {
            Write-Info "Enabling OpenSSH Client feature..."
            Enable-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client -All -NoRestart
            Write-Success "OpenSSH Client enabled. Please restart PowerShell and run this script again."
            Read-Host "Press Enter to exit"
            exit
        }
    }
    catch {
        Write-Error "Failed to enable OpenSSH. Please install manually."
        Write-Info "Alternative: Install PuTTY from https://www.putty.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Success "SSH client is available"

# Create deployment command
$deploymentUrl = "https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh"
$deployCommand = "wget $deploymentUrl && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

Write-Info "Connecting to server: $ServerIP"
Write-Info "Running deployment command..."

# Create expect-like script for password automation
$sshScript = @"
#!/bin/bash
sshpass -p '$Password' ssh -o StrictHostKeyChecking=no $Username@$ServerIP '$deployCommand'
"@

# Try different methods to connect
$connectionSuccess = $false

# Method 1: Try direct SSH (if password-less or key-based auth is set up)
try {
    Write-Info "Attempting direct SSH connection..."
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$ServerIP" $deployCommand
    if ($LASTEXITCODE -eq 0) {
        $connectionSuccess = $true
        Write-Success "Deployment completed via direct SSH"
    }
}
catch {
    Write-Warning "Direct SSH failed, trying alternative methods..."
}

# Method 2: Try with PowerShell SSH module (if available)
if (-not $connectionSuccess) {
    try {
        Write-Info "Attempting PowerShell SSH connection..."
        Import-Module Posh-SSH -ErrorAction SilentlyContinue

        $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)

        $session = New-SSHSession -ComputerName $ServerIP -Credential $credential -AcceptKey
        if ($session) {
            $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $deployCommand
            Remove-SSHSession -SessionId $session.SessionId
            $connectionSuccess = $true
            Write-Success "Deployment completed via PowerShell SSH"
        }
    }
    catch {
        Write-Warning "PowerShell SSH module not available or failed"
    }
}

# Method 3: Create batch file for PuTTY plink (if available)
if (-not $connectionSuccess) {
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    if ($plinkPath) {
        Write-Info "Using PuTTY plink..."
        try {
            $result = & plink -ssh -l $Username -pw $Password -batch $ServerIP $deployCommand
            if ($LASTEXITCODE -eq 0) {
                $connectionSuccess = $true
                Write-Success "Deployment completed via PuTTY plink"
            }
        }
        catch {
            Write-Warning "PuTTY plink failed"
        }
    }
}

# If all methods failed, provide manual instructions
if (-not $connectionSuccess) {
    Write-Error "Automatic deployment failed. Please deploy manually:"
    Write-Info ""
    Write-ColorOutput White "Manual Deployment Steps:"
    Write-ColorOutput White "1. Install SSH client (OpenSSH or PuTTY)"
    Write-ColorOutput White "2. Connect to server:"
    Write-ColorOutput Yellow "   ssh $Username@$ServerIP"
    Write-ColorOutput White "3. Enter password: $Password"
    Write-ColorOutput White "4. Run deployment command:"
    Write-ColorOutput Yellow "   $deployCommand"
    Write-Info ""
    Write-ColorOutput White "Or download and run: .\deploy-commands.cmd"
}
else {
    # Success message
    Write-ColorOutput Green @"

========================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
========================================

🌐 Your BVOTE 2025 URLs:
• Main Site: https://$Domain
• Admin Panel: https://admin.$Domain
• API Backend: https://api.$Domain
• Health Check: https://api.$Domain/health

🔧 Server Management:
• SSH: ssh $Username@$ServerIP
• Check Status: pm2 status
• View Logs: pm2 logs bvote-backend

✅ BVOTE 2025 is now live and ready to use!

"@
}

Write-Info ""
Read-Host "Press Enter to exit"
# BVOTE 2025 - PowerShell Auto Deployment Script
# This script will automatically deploy BVOTE 2025 to your server

param(
    [string]$ServerIP = "85.31.224.8",
    [string]$Username = "root",
    [string]$Password = "123123zz@",
    [string]$Domain = "votingonline2025.site"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

Clear-Host
Write-ColorOutput Green @"
========================================
🚀 BVOTE 2025 - Auto Deployment
========================================
Domain: $Domain
Server: $ServerIP
Username: $Username
========================================
"@

Write-Info "Starting deployment process..."

# Check if OpenSSH is available
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Warning "OpenSSH not found. Attempting to enable Windows OpenSSH..."

    try {
        # Try to enable OpenSSH Client feature
        $feature = Get-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client
        if ($feature.State -ne "Enabled") {
            Write-Info "Enabling OpenSSH Client feature..."
            Enable-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client -All -NoRestart
            Write-Success "OpenSSH Client enabled. Please restart PowerShell and run this script again."
            Read-Host "Press Enter to exit"
            exit
        }
    }
    catch {
        Write-Error "Failed to enable OpenSSH. Please install manually."
        Write-Info "Alternative: Install PuTTY from https://www.putty.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Success "SSH client is available"

# Create deployment command
$deploymentUrl = "https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh"
$deployCommand = "wget $deploymentUrl && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

Write-Info "Connecting to server: $ServerIP"
Write-Info "Running deployment command..."

# Create expect-like script for password automation
$sshScript = @"
#!/bin/bash
sshpass -p '$Password' ssh -o StrictHostKeyChecking=no $Username@$ServerIP '$deployCommand'
"@

# Try different methods to connect
$connectionSuccess = $false

# Method 1: Try direct SSH (if password-less or key-based auth is set up)
try {
    Write-Info "Attempting direct SSH connection..."
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$ServerIP" $deployCommand
    if ($LASTEXITCODE -eq 0) {
        $connectionSuccess = $true
        Write-Success "Deployment completed via direct SSH"
    }
}
catch {
    Write-Warning "Direct SSH failed, trying alternative methods..."
}

# Method 2: Try with PowerShell SSH module (if available)
if (-not $connectionSuccess) {
    try {
        Write-Info "Attempting PowerShell SSH connection..."
        Import-Module Posh-SSH -ErrorAction SilentlyContinue

        $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)

        $session = New-SSHSession -ComputerName $ServerIP -Credential $credential -AcceptKey
        if ($session) {
            $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $deployCommand
            Remove-SSHSession -SessionId $session.SessionId
            $connectionSuccess = $true
            Write-Success "Deployment completed via PowerShell SSH"
        }
    }
    catch {
        Write-Warning "PowerShell SSH module not available or failed"
    }
}

# Method 3: Create batch file for PuTTY plink (if available)
if (-not $connectionSuccess) {
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    if ($plinkPath) {
        Write-Info "Using PuTTY plink..."
        try {
            $result = & plink -ssh -l $Username -pw $Password -batch $ServerIP $deployCommand
            if ($LASTEXITCODE -eq 0) {
                $connectionSuccess = $true
                Write-Success "Deployment completed via PuTTY plink"
            }
        }
        catch {
            Write-Warning "PuTTY plink failed"
        }
    }
}

# If all methods failed, provide manual instructions
if (-not $connectionSuccess) {
    Write-Error "Automatic deployment failed. Please deploy manually:"
    Write-Info ""
    Write-ColorOutput White "Manual Deployment Steps:"
    Write-ColorOutput White "1. Install SSH client (OpenSSH or PuTTY)"
    Write-ColorOutput White "2. Connect to server:"
    Write-ColorOutput Yellow "   ssh $Username@$ServerIP"
    Write-ColorOutput White "3. Enter password: $Password"
    Write-ColorOutput White "4. Run deployment command:"
    Write-ColorOutput Yellow "   $deployCommand"
    Write-Info ""
    Write-ColorOutput White "Or download and run: .\deploy-commands.cmd"
}
else {
    # Success message
    Write-ColorOutput Green @"

========================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
========================================

🌐 Your BVOTE 2025 URLs:
• Main Site: https://$Domain
• Admin Panel: https://admin.$Domain
• API Backend: https://api.$Domain
• Health Check: https://api.$Domain/health

🔧 Server Management:
• SSH: ssh $Username@$ServerIP
• Check Status: pm2 status
• View Logs: pm2 logs bvote-backend

✅ BVOTE 2025 is now live and ready to use!

"@
}

Write-Info ""
Read-Host "Press Enter to exit"
# BVOTE 2025 - PowerShell Auto Deployment Script
# This script will automatically deploy BVOTE 2025 to your server

param(
    [string]$ServerIP = "85.31.224.8",
    [string]$Username = "root",
    [string]$Password = "123123zz@",
    [string]$Domain = "votingonline2025.site"
)

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

Clear-Host
Write-ColorOutput Green @"
========================================
🚀 BVOTE 2025 - Auto Deployment
========================================
Domain: $Domain
Server: $ServerIP
Username: $Username
========================================
"@

Write-Info "Starting deployment process..."

# Check if OpenSSH is available
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Warning "OpenSSH not found. Attempting to enable Windows OpenSSH..."
    
    try {
        # Try to enable OpenSSH Client feature
        $feature = Get-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client
        if ($feature.State -ne "Enabled") {
            Write-Info "Enabling OpenSSH Client feature..."
            Enable-WindowsOptionalFeature -Online -FeatureName OpenSSH.Client -All -NoRestart
            Write-Success "OpenSSH Client enabled. Please restart PowerShell and run this script again."
            Read-Host "Press Enter to exit"
            exit
        }
    }
    catch {
        Write-Error "Failed to enable OpenSSH. Please install manually."
        Write-Info "Alternative: Install PuTTY from https://www.putty.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Success "SSH client is available"

# Create deployment command
$deploymentUrl = "https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh"
$deployCommand = "wget $deploymentUrl && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

Write-Info "Connecting to server: $ServerIP"
Write-Info "Running deployment command..."

# Create expect-like script for password automation
$sshScript = @"
#!/bin/bash
sshpass -p '$Password' ssh -o StrictHostKeyChecking=no $Username@$ServerIP '$deployCommand'
"@

# Try different methods to connect
$connectionSuccess = $false

# Method 1: Try direct SSH (if password-less or key-based auth is set up)
try {
    Write-Info "Attempting direct SSH connection..."
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$ServerIP" $deployCommand
    if ($LASTEXITCODE -eq 0) {
        $connectionSuccess = $true
        Write-Success "Deployment completed via direct SSH"
    }
}
catch {
    Write-Warning "Direct SSH failed, trying alternative methods..."
}

# Method 2: Try with PowerShell SSH module (if available)
if (-not $connectionSuccess) {
    try {
        Write-Info "Attempting PowerShell SSH connection..."
        Import-Module Posh-SSH -ErrorAction SilentlyContinue
        
        $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)
        
        $session = New-SSHSession -ComputerName $ServerIP -Credential $credential -AcceptKey
        if ($session) {
            $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $deployCommand
            Remove-SSHSession -SessionId $session.SessionId
            $connectionSuccess = $true
            Write-Success "Deployment completed via PowerShell SSH"
        }
    }
    catch {
        Write-Warning "PowerShell SSH module not available or failed"
    }
}

# Method 3: Create batch file for PuTTY plink (if available)
if (-not $connectionSuccess) {
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    if ($plinkPath) {
        Write-Info "Using PuTTY plink..."
        try {
            $result = & plink -ssh -l $Username -pw $Password -batch $ServerIP $deployCommand
            if ($LASTEXITCODE -eq 0) {
                $connectionSuccess = $true
                Write-Success "Deployment completed via PuTTY plink"
            }
        }
        catch {
            Write-Warning "PuTTY plink failed"
        }
    }
}

# If all methods failed, provide manual instructions
if (-not $connectionSuccess) {
    Write-Error "Automatic deployment failed. Please deploy manually:"
    Write-Info ""
    Write-ColorOutput White "Manual Deployment Steps:"
    Write-ColorOutput White "1. Install SSH client (OpenSSH or PuTTY)"
    Write-ColorOutput White "2. Connect to server:"
    Write-ColorOutput Yellow "   ssh $Username@$ServerIP"
    Write-ColorOutput White "3. Enter password: $Password"
    Write-ColorOutput White "4. Run deployment command:"
    Write-ColorOutput Yellow "   $deployCommand"
    Write-Info ""
    Write-ColorOutput White "Or download and run: .\deploy-commands.cmd"
}
else {
    # Success message
    Write-ColorOutput Green @"

========================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
========================================

🌐 Your BVOTE 2025 URLs:
• Main Site: https://$Domain
• Admin Panel: https://admin.$Domain
• API Backend: https://api.$Domain
• Health Check: https://api.$Domain/health

🔧 Server Management:
• SSH: ssh $Username@$ServerIP
• Check Status: pm2 status
• View Logs: pm2 logs bvote-backend

✅ BVOTE 2025 is now live and ready to use!

"@
}

Write-Info ""
Read-Host "Press Enter to exit"
