@echo off
echo ========================================
echo BVOTE 2025 - Auto SSH Deployment
echo Domain: votingonline2025.site
echo Server: 85.31.224.8
echo ========================================
echo.

REM Check if plink (PuTTY) is available
where plink >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PuTTY plink not found!
    echo Please install PuTTY or use manual SSH connection.
    echo.
    echo Manual connection command:
    echo ssh root@85.31.224.8
    echo.
    pause
    exit /b 1
)

echo Connecting to server and running deployment...
echo Password: 123123zz@
echo.

REM Create temporary script file
echo wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh ^&^& chmod +x deploy-votingonline2025.sh ^&^& ./deploy-votingonline2025.sh > temp_deploy.sh

REM Execute deployment via SSH
plink -ssh -l root -pw 123123zz@ 85.31.224.8 "wget https://raw.githubusercontent.com/teophat559/bvote-2025/main/deploy-votingonline2025.sh && chmod +x deploy-votingonline2025.sh && ./deploy-votingonline2025.sh"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo DEPLOYMENT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Your BVOTE 2025 URLs:
    echo - Main Site: https://votingonline2025.site
    echo - Admin Panel: https://admin.votingonline2025.site
    echo - API Backend: https://api.votingonline2025.site
    echo - Health Check: https://api.votingonline2025.site/health
    echo.
) else (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

REM Cleanup
if exist temp_deploy.sh del temp_deploy.sh

echo Press any key to exit...
pause >nul
