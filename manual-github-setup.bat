@echo off
echo ========================================
echo 🔐 BVOTE 2025 - Manual GitHub Setup Guide
echo ========================================
echo.

echo 📋 Manual Setup Instructions:
echo.
echo 1️⃣ Install GitHub CLI manually:
echo    • Download from: https://cli.github.com/
echo    • Or run: winget install --id GitHub.cli
echo    • Or run: choco install gh
echo.
echo 2️⃣ Authenticate with GitHub:
echo    • Open new terminal/cmd
echo    • Run: gh auth login
echo    • Follow the prompts
echo.
echo 3️⃣ Add repository secret:
echo    • Run: echo 123123zz@ ^| gh secret set SERVER_PASSWORD --repo teophat559/bvote-2025
echo    • Or go to: https://github.com/teophat559/bvote-2025/settings/secrets/actions
echo    • Click "New repository secret"
echo    • Name: SERVER_PASSWORD
echo    • Value: 123123zz@
echo    • Click "Add secret"
echo.
echo 4️⃣ Verify setup:
echo    • Run: gh secret list --repo teophat559/bvote-2025
echo.
echo 5️⃣ Trigger deployment:
echo    • Run: gh workflow run "simple-deploy.yml" --repo teophat559/bvote-2025
echo    • Or go to: https://github.com/teophat559/bvote-2025/actions
echo.
echo ========================================
echo 🌐 Your URLs (after deployment):
echo • Main: https://votingonline2025.site
echo • Admin: https://admin.votingonline2025.site
echo • API: https://api.votingonline2025.site
echo ========================================
echo.

pause
