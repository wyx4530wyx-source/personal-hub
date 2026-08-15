@echo off
setlocal EnableExtensions
title Personal Hub - Cloudflare Quick Tunnel
cd /d "%~dp0"

set "CLOUDFLARED=C:\Users\Ibuki\AppData\Local\Cloudflare\cloudflared\cloudflared.exe"
set "PORT=3000"

if not exist "%CLOUDFLARED%" (
  echo [ERROR] Cloudflare Quick Tunnel is not installed.
  echo Please keep this window open and send me a screenshot.
  pause
  exit /b 1
)

if /i "%~1"=="--check" exit /b 0
if /i "%PERSONAL_HUB_NO_START%"=="1" exit /b 0

powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener=Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if($listener){exit 0}else{exit 1}"
if errorlevel 1 (
  echo Starting the local website in another window...
  start "Personal Hub Local Website" cmd /k call "%~dp0tools\start-public-origin.cmd"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(45); while((Get-Date)-lt $deadline){$listener=Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if($listener){exit 0}; Start-Sleep -Seconds 1}; exit 1"
  if errorlevel 1 (
    echo [ERROR] The local website did not start in time.
    echo Keep both windows open and send me a screenshot.
    pause
    exit /b 1
  )
)

echo.
echo ==================================================
echo       PERSONAL HUB - PUBLIC QUICK TUNNEL
echo ==================================================
echo.
echo Cloudflare will print an HTTPS trycloudflare.com URL below.
echo Share only that HTTPS URL with other people.
echo Keep this window and the website window open.
echo Close this window when you want to stop public access.
echo.

"%CLOUDFLARED%" tunnel --url http://localhost:%PORT% --edge-ip-version auto

echo.
echo Public access has stopped.
pause
