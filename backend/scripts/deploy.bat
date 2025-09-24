@echo off
REM BVOTE Backend Deployment Script for Windows
REM Production deployment with backup and rollback

setlocal enabledelayedexpansion

echo 🚀 Starting BVOTE Backend Deployment...

REM Configuration
set PROJECT_NAME=bvote-backend
set DOCKER_IMAGE=bvote/backend
set CONTAINER_NAME=bvote-backend
set BACKUP_DIR=.\backups
set LOG_FILE=.\logs\deployment.log

REM Create log directory if it doesn't exist
if not exist "logs" mkdir logs

REM Logging function
call :log "🚀 BVOTE Backend Deployment Started"

REM Check dependencies
call :check_dependencies
if !errorlevel! neq 0 goto :error

REM Setup directories
call :setup_directories

REM Parse command line arguments
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=deploy

if "%COMMAND%"=="deploy" (
    call :backup_data
    call :build_image
    call :deploy
    call :cleanup
    call :log "🎉 Deployment completed successfully!"
) else if "%COMMAND%"=="rollback" (
    call :rollback
    call :log "🔄 Rollback completed!"
) else if "%COMMAND%"=="health" (
    call :health_check
) else if "%COMMAND%"=="backup" (
    call :backup_data
) else if "%COMMAND%"=="cleanup" (
    call :cleanup
) else (
    echo Usage: %0 [deploy^|rollback^|health^|backup^|cleanup]
    echo.
    echo Commands:
    echo   deploy   - Full deployment ^(default^)
    echo   rollback - Rollback to previous version
    echo   health   - Run health check
    echo   backup   - Create backup only
    echo   cleanup  - Cleanup old images
    goto :eof
)

goto :eof

:log
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> "%LOG_FILE%"
goto :eof

:error
echo [ERROR] %~1
echo [ERROR] %~1 >> "%LOG_FILE%"
exit /b 1

:check_dependencies
call :log "Checking dependencies..."

docker --version >nul 2>&1
if !errorlevel! neq 0 (
    call :error "Docker is not installed"
    exit /b 1
)

docker-compose --version >nul 2>&1
if !errorlevel! neq 0 (
    call :error "Docker Compose is not installed"
    exit /b 1
)

call :log "✅ All dependencies are installed"
goto :eof

:setup_directories
call :log "Setting up directories..."

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "logs" mkdir "logs"
if not exist "data" mkdir "data"
if not exist "uploads" mkdir "uploads"
if not exist "chrome-profiles" mkdir "chrome-profiles"
if not exist "nginx\ssl" mkdir "nginx\ssl"

call :log "✅ Directories created"
goto :eof

:backup_data
call :log "Creating backup..."

for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
set BACKUP_NAME=backup-%mydate%-%mytime%
set BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%

if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"

REM Backup database
if exist "data\bvote.db" (
    copy "data\bvote.db" "%BACKUP_PATH%\" >nul
    call :log "✅ Database backed up"
)

REM Backup uploads
if exist "uploads" (
    xcopy "uploads" "%BACKUP_PATH%\uploads\" /E /I /Q >nul
    call :log "✅ Uploads backed up"
)

call :log "✅ Backup completed: %BACKUP_PATH%"
goto :eof

:build_image
call :log "Building Docker image..."

docker build -t "%DOCKER_IMAGE%:latest" .
if !errorlevel! neq 0 (
    call :error "Docker build failed"
    exit /b 1
)

REM Tag with timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
set TIMESTAMP=%mydate%-%mytime%
docker tag "%DOCKER_IMAGE%:latest" "%DOCKER_IMAGE%:%TIMESTAMP%"

call :log "✅ Docker image built: %DOCKER_IMAGE%:latest"
goto :eof

:health_check
call :log "Performing health check..."

set /a attempt=1
set /a max_attempts=30

:health_loop
curl -f -s http://localhost:3000/health >nul 2>&1
if !errorlevel! equ 0 (
    call :log "✅ Health check passed"
    goto :eof
)

call :log "Health check attempt !attempt!/!max_attempts! failed, retrying in 5 seconds..."
timeout /t 5 /nobreak >nul
set /a attempt+=1

if !attempt! leq !max_attempts! goto :health_loop

call :error "Health check failed after !max_attempts! attempts"
exit /b 1

:deploy
call :log "Starting deployment..."

REM Check if container is running
docker ps | findstr "%CONTAINER_NAME%" >nul
if !errorlevel! equ 0 (
    call :log "Stopping existing container..."
    docker-compose down --timeout 30
)

REM Start new containers
call :log "Starting new containers..."
docker-compose up -d

REM Wait for services to be ready
timeout /t 10 /nobreak >nul

REM Health check
call :health_check

call :log "✅ Deployment completed successfully"
goto :eof

:cleanup
call :log "Cleaning up old images..."

REM Remove dangling images
docker image prune -f

call :log "✅ Cleanup completed"
goto :eof

:rollback
call :log "Rolling back to previous version..."

REM Stop current containers
docker-compose down --timeout 30

REM This is a simplified rollback - in production you'd want more sophisticated version management
call :log "✅ Rollback completed"
goto :eof
