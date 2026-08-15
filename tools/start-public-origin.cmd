@echo off
setlocal EnableExtensions
title Personal Hub - Local Website
cd /d "%~dp0.."

set "PORT=3000"
set "NPM_CMD="

for /f "delims=" %%I in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%I"

if not defined NPM_CMD (
  for /d %%D in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do (
    if exist "%%~fD\bin\npm.cmd" set "NPM_CMD=%%~fD\bin\npm.cmd"
  )
)

if not defined NPM_CMD (
  echo [ERROR] Node.js was not found.
  echo Keep this window open and send me a screenshot.
  pause
  exit /b 1
)

for %%N in ("%NPM_CMD%") do set "NODE_BIN=%%~dpN"
set "PATH=%NODE_BIN%;%PATH%"

if not exist "node_modules\vinext" (
  echo Preparing the website for the first start. Please wait...
  call "%NPM_CMD%" install
  if errorlevel 1 goto :START_ERROR
)

call "%NPM_CMD%" run dev -- --hostname 0.0.0.0 --port %PORT%
if errorlevel 1 goto :START_ERROR
exit /b 0

:START_ERROR
echo.
echo [START FAILED] Keep this window open and send me a screenshot.
pause
exit /b 1
