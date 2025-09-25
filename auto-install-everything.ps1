# BVOTE 2025 - Auto Install Everything (PowerShell Version)
# This script will automatically install and configure everything

param(
    [switch]$SkipConfirmation = $false
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 BVOTE 2025 - AUTO INSTALL EVERYTHING" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 This script will automatically:" -ForegroundColor White
Write-Host "  • Install all required dependencies" -ForegroundColor Gray
Write-Host "  • Setup GitHub CLI and authentication" -ForegroundColor Gray
Write-Host "  • Install Node.js and npm packages" -ForegroundColor Gray
Write-Host "  • Setup database" -ForegroundColor Gray
Write-Host "  • Configure environment" -ForegroundColor Gray
Write-Host "  • Deploy to production" -ForegroundColor Gray
Write-Host ""

if (-not $SkipConfirmation) {
    $confirm = Read-Host "Continue with automatic installation? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 STEP 1: INSTALLING DEPENDENCIES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check and install Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "❌ Node.js not found. Installing..." -ForegroundColor Red

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "📦 Installing Node.js via winget..." -ForegroundColor Yellow
        winget install --id OpenJS.NodeJS --accept-package-agreements --accept-source-agreements
        Start-Sleep -Seconds 5
    }
    else {
        Write-Host "❌ Winget not available. Please install Node.js manually from: https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ Node.js already installed" -ForegroundColor Green
    node --version
}

# Check and install GitHub CLI
Write-Host ""
Write-Host "📦 Checking GitHub CLI..." -ForegroundColor Yellow
$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghExists) {
    Write-Host "❌ GitHub CLI not found. Installing..." -ForegroundColor Red

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "📦 Installing GitHub CLI via winget..." -ForegroundColor Yellow
        winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
        Start-Sleep -Seconds 5

        # Check if installation worked
        $ghExists = Get-Command gh -ErrorAction SilentlyContinue
        if (-not $ghExists) {
            Write-Host "❌ GitHub CLI installation failed. Please install manually from: https://cli.github.com/" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Winget not available. Please install GitHub CLI manually from: https://cli.github.com/" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ GitHub CLI already installed" -ForegroundColor Green
    gh --version
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔐 STEP 2: GITHUB AUTHENTICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "🔐 Checking GitHub authentication..." -ForegroundColor Yellow
try {
    $authResult = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔑 Starting GitHub authentication..." -ForegroundColor Yellow
        Write-Host "Please follow the prompts to authenticate with GitHub" -ForegroundColor White
        gh auth login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Authentication failed!" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "✅ Already authenticated with GitHub" -ForegroundColor Green
    }
}
catch {
    Write-Host "🔑 Starting GitHub authentication..." -ForegroundColor Yellow
    gh auth login
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📦 STEP 3: INSTALLING PROJECT DEPENDENCIES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\package.json") {
    Push-Location backend
    Write-Host "Installing backend packages..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Backend package.json not found, skipping backend install" -ForegroundColor Yellow
}

# Install admin dependencies
Write-Host ""
Write-Host "📦 Installing admin dependencies..." -ForegroundColor Yellow
if (Test-Path "admin\package.json") {
    Push-Location admin
    Write-Host "Installing admin packages..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Admin npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "✅ Admin dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Admin package.json not found, skipping admin install" -ForegroundColor Yellow
}

# Install root dependencies
Write-Host ""
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "Installing root packages..." -ForegroundColor White
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Root npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Root package.json not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🗄️ STEP 4: DATABASE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "🗄️ Setting up database..." -ForegroundColor Yellow
if (Test-Path "backend\database.js") {
    Push-Location backend
    Write-Host "Running database setup..." -ForegroundColor White
    node database.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Database setup had issues, continuing anyway..." -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Database setup completed" -ForegroundColor Green
    }
    Pop-Location
}
else {
    Write-Host "⚠️ Database setup file not found, skipping database setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔐 STEP 5: GITHUB SECRETS SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "🔐 Adding SERVER_PASSWORD secret..." -ForegroundColor Yellow
try {
    $secretValue = "123123zz@"
    $result = Write-Output $secretValue | gh secret set SERVER_PASSWORD --repo "teophat559/bvote-2025"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SERVER_PASSWORD secret added successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to add secret automatically" -ForegroundColor Red
        Write-Host "Manual setup: https://github.com/teophat559/bvote-2025/settings/secrets/actions" -ForegroundColor White
        Write-Host "Add: SERVER_PASSWORD = 123123zz@" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error adding secret: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Verifying secrets..." -ForegroundColor Yellow
gh secret list --repo "teophat559/bvote-2025"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🏗️ STEP 6: BUILDING PROJECT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "🏗️ Building admin panel..." -ForegroundColor Yellow
if (Test-Path "admin\package.json") {
    Push-Location admin
    Write-Host "Building admin..." -ForegroundColor White
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Admin build failed, continuing anyway..." -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Admin build completed" -ForegroundColor Green
    }
    Pop-Location
}
else {
    Write-Host "⚠️ Admin build script not found, skipping build" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 STEP 7: DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "🚀 Triggering GitHub Actions deployment..." -ForegroundColor Yellow
try {
    gh workflow run "simple-deploy.yml" --repo "teophat559/bvote-2025"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
        Write-Host "📊 View progress at: https://github.com/teophat559/bvote-2025/actions" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ Failed to trigger deployment automatically" -ForegroundColor Red
        Write-Host "Manual trigger: https://github.com/teophat559/bvote-2025/actions" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error triggering deployment: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 INSTALLATION COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 What was installed and configured:" -ForegroundColor White
Write-Host "• Node.js and npm" -ForegroundColor Gray
Write-Host "• GitHub CLI and authentication" -ForegroundColor Gray
Write-Host "• All project dependencies (backend, admin, root)" -ForegroundColor Gray
Write-Host "• Database setup" -ForegroundColor Gray
Write-Host "• GitHub secrets configuration" -ForegroundColor Gray
Write-Host "• Project build" -ForegroundColor Gray
Write-Host "• Deployment trigger" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 Your URLs (after deployment completes):" -ForegroundColor White
Write-Host "• Main Site: https://votingonline2025.site" -ForegroundColor Cyan
Write-Host "• Admin Panel: https://admin.votingonline2025.site" -ForegroundColor Cyan
Write-Host "• API Backend: https://api.votingonline2025.site" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Monitor deployment progress:" -ForegroundColor White
Write-Host "• GitHub Actions: https://github.com/teophat559/bvote-2025/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Next steps:" -ForegroundColor White
Write-Host "• Wait for deployment to complete (5-10 minutes)" -ForegroundColor Gray
Write-Host "• Check the URLs above to verify everything works" -ForegroundColor Gray
Write-Host "• Every code push will now auto-deploy!" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ BVOTE 2025 is now fully automated!" -ForegroundColor Green
Write-Host ""

# Start local development server
$startdev = Read-Host "🚀 Start local development server now? (y/n)"
if ($startdev -eq "y" -or $startdev -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting local development servers..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening multiple terminals for:" -ForegroundColor White
    Write-Host "• Backend server (port 5000)" -ForegroundColor Gray
    Write-Host "• Admin development (port 3000)" -ForegroundColor Gray
    Write-Host ""

    # Start backend server
    if (Test-Path "backend\server.js") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal
    }

    # Start admin dev server
    if (Test-Path "admin\package.json") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin; npm run dev" -WindowStyle Normal
    }

    Write-Host "✅ Development servers started!" -ForegroundColor Green
    Write-Host "• Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "• Admin: http://localhost:3000" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Press Enter to exit"