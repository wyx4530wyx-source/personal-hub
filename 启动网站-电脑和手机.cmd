@echo off
setlocal EnableExtensions
title Personal Hub - PC and Phone

cd /d "%~dp0"
set "PORT=3000"
set "NPM_CMD="

echo.
echo ==================================================
echo          PERSONAL HUB - LOCAL WIFI START
echo ==================================================
echo.

rem Use a normal Node.js installation when it is available.
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%I"

rem Otherwise use the Node.js runtime bundled with Codex.
if not defined NPM_CMD (
  for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do (
    if exist "%%~fD\bin\npm.cmd" set "NPM_CMD=%%~fD\bin\npm.cmd"
  )
)

if not defined NPM_CMD (
  echo [ERROR] Node.js was not found.
  echo Keep this window open and send me a screenshot.
  echo.
  pause
  exit /b 1
)

rem Make node.exe available to every command started by npm.
for %%N in ("%NPM_CMD%") do set "NODE_BIN=%%~dpN"
set "PATH=%NODE_BIN%;%PATH%"

if not exist "package.json" (
  echo [ERROR] This file is not inside the website root folder.
  echo Move it back into personal-hub-1-home-2-posts.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vinext" (
  echo Preparing the website for the first start. Please wait...
  call "%NPM_CMD%" install
  if errorlevel 1 goto :START_ERROR
  echo.
)

rem Remove a crashed vinext process from this folder when it is not listening.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$dir=(Resolve-Path '.').Path; $listener=Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if(-not $listener){Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like ('*' + $dir + '*') -and $_.CommandLine -match 'vinext.*dev' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"

set "PORT_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING" 2^>nul') do set "PORT_PID=%%P"
if defined PORT_PID (
  echo [ERROR] Port %PORT% is already in use.
  echo Close the old website command window, then run this file again.
  echo.
  pause
  exit /b 1
)

echo PC URL:    http://localhost:%PORT%
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ips=Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and $_.InterfaceAlias -notmatch 'VPN|TAP|TUN|Wintun|vEthernet|Virtual' } | Sort-Object @{Expression={if($_.InterfaceAlias -match 'Wi-Fi|WLAN'){0}elseif($_.InterfaceAlias -match 'Ethernet'){1}else{2}}}; if($ips){$ips | ForEach-Object { Write-Host ('PHONE URL: http://' + $_.IPAddress + ':%PORT%') }}else{Write-Host 'PHONE URL: Connect this PC to WiFi, then run this file again.'}"
echo.
echo Keep this window open while using the website.
echo The PC and phone must use the same WiFi.
echo When using a VPN, enable Allow LAN or Local network access.
echo If Windows Firewall asks, allow Private networks.
echo Close this window when you want to stop the website.
echo.
echo Starting the website. Please wait a few seconds...
echo ==================================================
echo.

if /i "%PERSONAL_HUB_NO_START%"=="1" exit /b 0

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:%PORT%'"
call "%NPM_CMD%" run dev -- --hostname 0.0.0.0 --port %PORT%

if errorlevel 1 goto :START_ERROR
exit /b 0

:START_ERROR
echo.
echo [START FAILED] Keep this window open and send me a screenshot.
echo.
pause
exit /b 1
