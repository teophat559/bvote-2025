# BVOTE 2025 - Auto Setup GitHub Secrets
# This script will help you automatically add GitHub secrets

param(
    [string]$GitHubToken = "",
    [string]$RepoOwner = "teophat559",
    [string]$RepoName = "bvote-2025"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "🔐 BVOTE 2025 - Auto GitHub Secrets Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if GitHub CLI is installed
$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghExists) {
    Write-Host "❌ GitHub CLI not found. Installing..." -ForegroundColor Red
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> origin/main
    
    # Try to install GitHub CLI
    try {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Host "📦 Installing GitHub CLI via winget..." -ForegroundColor Yellow
            winget install --id GitHub.cli
        } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
            Write-Host "📦 Installing GitHub CLI via chocolatey..." -ForegroundColor Yellow
            choco install gh
        } else {
            Write-Host "❌ Cannot install GitHub CLI automatically." -ForegroundColor Red
            Write-Host "Please install manually from: https://cli.github.com/" -ForegroundColor White
            Write-Host ""
            Write-Host "Or use manual method below:" -ForegroundColor Yellow
            Write-Host "1. Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
            Write-Host "2. Click 'New repository secret'" -ForegroundColor White
            Write-Host "3. Name: SERVER_PASSWORD" -ForegroundColor White
            Write-Host "4. Value: 123123zz@" -ForegroundColor White
            Write-Host "5. Click 'Add secret'" -ForegroundColor White
            Read-Host "Press Enter to exit"
            exit
        }
    } catch {
        Write-Host "❌ Failed to install GitHub CLI: $($_.Exception.Message)" -ForegroundColor Red
<<<<<<< HEAD
=======

    # Try to install GitHub CLI
    try {
        $installSuccess = $false

        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Host "📦 Installing GitHub CLI via winget..." -ForegroundColor Yellow
            $result = winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
            Start-Sleep -Seconds 3

            # Check if installation was successful
            if (Get-Command gh -ErrorAction SilentlyContinue) {
                Write-Host "✅ GitHub CLI installed successfully via winget!" -ForegroundColor Green
                $installSuccess = $true
            }
            else {
                Write-Host "⚠️ Winget installation completed but gh command not found. You may need to restart your terminal." -ForegroundColor Yellow
            }
        }

        if (-not $installSuccess -and (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Host "📦 Installing GitHub CLI via chocolatey..." -ForegroundColor Yellow
            choco install gh -y
            Start-Sleep -Seconds 3
            refreshenv

            # Check if installation was successful
            if (Get-Command gh -ErrorAction SilentlyContinue) {
                Write-Host "✅ GitHub CLI installed successfully via chocolatey!" -ForegroundColor Green
                $installSuccess = $true
            }
            else {
                Write-Host "⚠️ Chocolatey installation completed but gh command not found. You may need to restart your terminal." -ForegroundColor Yellow
            }
        }

        if (-not $installSuccess) {
            Write-Host "📦 Trying direct download method..." -ForegroundColor Yellow
            $url = 'https://github.com/cli/cli/releases/latest/download/gh_windows_amd64.msi'
            $output = "$env:TEMP\gh_installer.msi"

            Write-Host "⬇️ Downloading GitHub CLI installer..." -ForegroundColor Cyan
            Invoke-WebRequest -Uri $url -OutFile $output

            Write-Host "🔧 Installing GitHub CLI..." -ForegroundColor Cyan
            Start-Process msiexec -ArgumentList '/i', $output, '/quiet', '/norestart' -Wait
            Remove-Item $output -Force

            Write-Host "✅ GitHub CLI installation completed!" -ForegroundColor Green
            Write-Host "⚠️ Please restart your terminal/PowerShell and run this script again." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 0
        }
    }
    catch {
        Write-Host "❌ Failed to install GitHub CLI: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual installation options:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://cli.github.com/" -ForegroundColor White
        Write-Host "2. Or use manual GitHub secrets setup:" -ForegroundColor White
        Write-Host "   • Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor White
        Write-Host "   • Click 'New repository secret'" -ForegroundColor White
        Write-Host "   • Name: SERVER_PASSWORD" -ForegroundColor White
        Write-Host "   • Value: 123123zz@" -ForegroundColor White
        Write-Host "   • Click 'Add secret'" -ForegroundColor White
        Read-Host "Press Enter to exit"
>>>>>>> Stashed changes
=======
>>>>>>> origin/main
        exit 1
    }
}

Write-Host "✅ GitHub CLI is available" -ForegroundColor Green

# Check if user is authenticated
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔐 Not authenticated with GitHub. Starting authentication..." -ForegroundColor Yellow
        gh auth login
<<<<<<< HEAD
<<<<<<< Updated upstream
        
=======

>>>>>>> Stashed changes
=======
        
>>>>>>> origin/main
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ GitHub authentication failed" -ForegroundColor Red
            exit 1
        }
    }
<<<<<<< HEAD
<<<<<<< Updated upstream
} catch {
=======
}
catch {
>>>>>>> Stashed changes
=======
} catch {
>>>>>>> origin/main
    Write-Host "🔐 Starting GitHub authentication..." -ForegroundColor Yellow
    gh auth login
}

Write-Host "✅ GitHub authentication successful" -ForegroundColor Green

# Set repository context
Write-Host "🔧 Setting repository context: $RepoOwner/$RepoName" -ForegroundColor Cyan

# Add SERVER_PASSWORD secret
Write-Host "🔐 Adding SERVER_PASSWORD secret..." -ForegroundColor Yellow

try {
    $secretValue = "123123zz@"
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> origin/main
    $result = echo $secretValue | gh secret set SERVER_PASSWORD --repo "$RepoOwner/$RepoName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SERVER_PASSWORD secret added successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to add SERVER_PASSWORD secret" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
} catch {
<<<<<<< HEAD
=======
    $result = Write-Output $secretValue | gh secret set SERVER_PASSWORD --repo "$RepoOwner/$RepoName"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SERVER_PASSWORD secret added successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to add SERVER_PASSWORD secret" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
}
catch {
>>>>>>> Stashed changes
=======
>>>>>>> origin/main
    Write-Host "❌ Error adding secret: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify secrets
Write-Host "🔍 Verifying secrets..." -ForegroundColor Cyan
try {
    $secrets = gh secret list --repo "$RepoOwner/$RepoName"
    Write-Host "📋 Current secrets:" -ForegroundColor White
    Write-Host $secrets -ForegroundColor Gray
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> origin/main
    
    if ($secrets -match "SERVER_PASSWORD") {
        Write-Host "✅ SERVER_PASSWORD secret is configured!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SERVER_PASSWORD secret not found" -ForegroundColor Yellow
    }
} catch {
<<<<<<< HEAD
=======

    if ($secrets -match "SERVER_PASSWORD") {
        Write-Host "✅ SERVER_PASSWORD secret is configured!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ SERVER_PASSWORD secret not found" -ForegroundColor Yellow
    }
}
catch {
>>>>>>> Stashed changes
=======
>>>>>>> origin/main
    Write-Host "⚠️ Could not verify secrets: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Trigger deployment
Write-Host ""
Write-Host "🚀 Do you want to trigger deployment now? (y/n)" -ForegroundColor Yellow
$trigger = Read-Host

if ($trigger -eq "y" -or $trigger -eq "Y" -or $trigger -eq "yes") {
    Write-Host "🚀 Triggering GitHub Actions deployment..." -ForegroundColor Green
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
>>>>>>> origin/main
    
    try {
        $result = gh workflow run "simple-deploy.yml" --repo "$RepoOwner/$RepoName"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
            Write-Host "📊 View progress at: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to trigger deployment: $result" -ForegroundColor Red
        }
    } catch {
<<<<<<< HEAD
=======

    try {
        $result = gh workflow run "simple-deploy.yml" --repo "$RepoOwner/$RepoName"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
            Write-Host "📊 View progress at: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Cyan
        }
        else {
            Write-Host "❌ Failed to trigger deployment: $result" -ForegroundColor Red
        }
    }
    catch {
>>>>>>> Stashed changes
=======
>>>>>>> origin/main
        Write-Host "❌ Error triggering deployment: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 SETUP COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was configured:" -ForegroundColor White
Write-Host "• GitHub CLI installed and authenticated" -ForegroundColor Gray
Write-Host "• SERVER_PASSWORD secret added to repository" -ForegroundColor Gray
Write-Host "• GitHub Actions workflows are ready" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Your URLs (after deployment):" -ForegroundColor White
Write-Host "• Main Site: https://votingonline2025.site" -ForegroundColor Cyan
Write-Host "• Admin Panel: https://admin.votingonline2025.site" -ForegroundColor Cyan
Write-Host "• API Backend: https://api.votingonline2025.site" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Monitor deployment:" -ForegroundColor White
Write-Host "• GitHub Actions: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Auto deployment is now active!" -ForegroundColor Green
Write-Host "Every time you push code, it will automatically deploy to your server." -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
