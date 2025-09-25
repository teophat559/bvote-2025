@echo off
REM BVOTE 2025 - Deployment Commands for Windows

echo ========================================
echo BVOTE 2025 Auto Deployment
echo ========================================
echo.
echo Choose deployment method:
echo 1. Auto SSH with PuTTY (Recommended)
echo 2. Manual SSH Instructions
echo 3. Create PowerShell Script
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto auto_ssh
if "%choice%"=="2" goto manual_ssh
if "%choice%"=="3" goto powershell_script
if "%choice%"=="4" goto exit
goto invalid_choice

:auto_ssh
echo.
echo Starting Auto SSH Deployment...
echo.
REM Check if PuTTY is installed
where plink >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PuTTY not found! Please install PuTTY first.
    echo Download from: https://www.putty.org/
    pause
    goto menu
)

echo Connecting to server: 85.31.224.8
echo Username: root
echo Running deployment script...
echo.

plink -ssh -l root -pw 123123zz@ 85.31.224.8 "wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo DEPLOYMENT SUCCESS!
    echo ========================================
    echo.
    echo Your URLs:
    echo - https://votingonline2025.site
    echo - https://admin.votingonline2025.site
    echo - https://api.votingonline2025.site
) else (
    echo.
    echo Deployment failed. Try manual method.
)
pause
goto menu

:manual_ssh
echo.
echo ========================================
echo Manual SSH Deployment Instructions
echo ========================================
echo.
echo 1. Open Command Prompt or PowerShell
echo 2. Run: ssh root@85.31.224.8
echo 3. Enter password: 123123zz@
echo 4. Run deployment command:
echo.
echo wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh ^&^& chmod +x deploy-votingonline2025.sh ^&^& ./deploy-votingonline2025.sh
echo.
echo ========================================
echo.
pause
goto menu

:powershell_script
echo.
echo Creating PowerShell deployment script...
echo.

(
echo # BVOTE 2025 PowerShell Deployment Script
echo Write-Host "BVOTE 2025 - PowerShell Deployment" -ForegroundColor Green
echo Write-Host "=====================================" -ForegroundColor Green
echo.
echo $server = "85.31.224.8"
echo $username = "root"
echo $password = "123123zz@"
echo.
echo Write-Host "Connecting to server: $server" -ForegroundColor Yellow
echo.
echo # Create SSH command
echo $deployCmd = "wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"
echo.
echo # Try to connect via SSH
echo try {
echo     Write-Host "Running deployment..." -ForegroundColor Yellow
echo     ssh root@85.31.224.8 $deployCmd
echo     Write-Host "Deployment completed!" -ForegroundColor Green
echo } catch {
echo     Write-Host "SSH failed. Please install OpenSSH or use PuTTY." -ForegroundColor Red
echo     Write-Host "Manual command: ssh root@85.31.224.8" -ForegroundColor White
echo }
echo.
echo Read-Host "Press Enter to exit"
) > deploy-bvote.ps1

echo PowerShell script created: deploy-bvote.ps1
echo.
echo To run the PowerShell script:
echo 1. Right-click deploy-bvote.ps1
echo 2. Select "Run with PowerShell"
echo.
pause
goto menu

:invalid_choice
echo.
echo Invalid choice! Please select 1-4.
pause

:menu
cls
goto :eof

:exit
echo.
echo Goodbye!
exit /b 0
