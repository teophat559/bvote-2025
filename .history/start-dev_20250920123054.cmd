@echo off
title BVOTE Development Environment

echo ========================================
echo 🚀 BVOTE Development Environment
echo ========================================
echo.

REM Color setup
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"

echo %ESC%[92m📚 Starting Backend Server...%ESC%[0m
start "Backend Server" cmd /k "cd backend && start-dev.cmd"

timeout /t 3 /nobreak > nul

echo %ESC%[94m🎨 Starting Admin Frontend...%ESC%[0m
start "Admin Frontend" cmd /k "cd admin && npm run dev"

timeout /t 2 /nobreak > nul

echo %ESC%[93m👤 Starting User Frontend...%ESC%[0m
start "User Frontend" cmd /k "cd user && npm run dev"

echo.
echo %ESC%[96m========================================%ESC%[0m
echo %ESC%[96m✅ All services are starting up...%ESC%[0m
echo %ESC%[96m========================================%ESC%[0m
echo.
echo %ESC%[92m🔗 Backend API:%ESC%[0m      http://localhost:3000/api/health
echo %ESC%[94m🔗 Admin Panel:%ESC%[0m     http://localhost:5173
echo %ESC%[93m🔗 User App:%ESC%[0m        http://localhost:5174
echo %ESC%[96m🔗 Monitoring:%ESC%[0m      http://localhost:3000/api/monitoring/health
echo.
echo %ESC%[91mPress any key to close all services...%ESC%[0m
pause > nul

REM Kill all related processes
taskkill /f /im node.exe 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend Server" 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Admin Frontend" 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq User Frontend" 2>nul

echo %ESC%[91m🛑 All services stopped.%ESC%[0m
timeout /t 2 /nobreak > nul
