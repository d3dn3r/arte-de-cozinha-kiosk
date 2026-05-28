@echo off
:: ─────────────────────────────────────────────────────────────────
::  SETUP.bat  —  Arte de Cozinha Kiosk  (one-click installer)
::
::  HOW TO USE
::    1. Place caddy_windows_amd64.exe in this same folder
::    2. Right-click this file → "Run as administrator"
::    3. Done — server starts automatically on every boot
::
::  SERVICE NAME:  MuseumKiosk
::  To stop  :  net stop MuseumKiosk
::  To remove:  sc delete MuseumKiosk
:: ─────────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion

echo.
echo  Arte de Cozinha — One-Click Kiosk Setup
echo  ========================================
echo.

:: ── Check for Administrator ───────────────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: This script must be run as Administrator.
  echo  Right-click this file and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

:: ── Step 1: Locate or install caddy ──────────────────────────────
set "CADDY="

:: Check if caddy is already in PATH
for /f "tokens=*" %%C in ('where caddy 2^>nul') do (
  set "CADDY=%%C"
)

if defined CADDY (
  echo  [1/5] Caddy already installed: !CADDY!
  goto :caddy_ready
)

:: Not in PATH — look for caddy*.exe in the same folder as this script
echo  [1/5] Caddy not found in PATH. Searching this folder...
set "FOUND_EXE="
for %%F in ("%~dp0caddy*.exe") do (
  set "FOUND_EXE=%%F"
)

if not defined FOUND_EXE (
  echo.
  echo  ERROR: No caddy*.exe found in this folder.
  echo.
  echo  Please download Caddy for Windows from:
  echo    https://caddyserver.com/download
  echo  Choose: Windows ^> amd64 ^> Download
  echo  Then place the downloaded .exe in this same folder and run
  echo  this script again.
  echo.
  pause
  exit /b 1
)

echo         Found: !FOUND_EXE!
echo         Copying to C:\Windows\System32\caddy.exe ...
copy /Y "!FOUND_EXE!" "C:\Windows\System32\caddy.exe" >nul
if %errorlevel% neq 0 (
  echo.
  echo  ERROR: Could not copy to System32. Make sure you are running
  echo  as Administrator.
  echo.
  pause
  exit /b 1
)
set "CADDY=C:\Windows\System32\caddy.exe"
echo         Caddy installed to !CADDY!

:caddy_ready
:: ── Step 2: Resolve paths ─────────────────────────────────────────
set "KIOSK_DIR=%~dp0"
set "CONFIG=%~dp0Caddyfile"

echo.
echo  [2/5] Configuration:
echo         Caddy  : !CADDY!
echo         Config : !CONFIG!
echo         Dist   : !KIOSK_DIR!dist
echo.

:: ── Step 3: Persist KIOSK_DIR as machine-wide environment variable
setx /M KIOSK_DIR "!KIOSK_DIR!" >nul
echo  [3/5] Set machine env var KIOSK_DIR=!KIOSK_DIR!

:: ── Step 4: Remove any existing service instance ─────────────────
sc query MuseumKiosk >nul 2>&1
if %errorlevel%==0 (
  echo  [4/5] Removing existing MuseumKiosk service...
  net stop MuseumKiosk >nul 2>&1
  sc delete MuseumKiosk >nul 2>&1
  timeout /t 3 /nobreak >nul
) else (
  echo  [4/5] No existing service found.
)

:: ── Step 5: Create and start the service ─────────────────────────
echo  [5/5] Creating and starting MuseumKiosk service...
sc create "MuseumKiosk" ^
  binPath= "\"!CADDY!\" run --config \"!CONFIG!\"" ^
  DisplayName= "Museum Kiosk (Arte de Cozinha)" ^
  start= auto ^
  obj= LocalSystem
if %errorlevel% neq 0 (
  echo.
  echo  ERROR: Failed to create service. Make sure you are running
  echo  as Administrator.
  echo.
  pause
  exit /b 1
)
sc description "MuseumKiosk" "Caddy web server for Arte de Cozinha flipbook kiosk"
net start MuseumKiosk

echo.
echo  ══════════════════════════════════════════════════════════════
echo   Setup complete!
echo   The kiosk server is running and will start on every boot.
echo   Open Edge and go to:  http://localhost:8080
echo  ══════════════════════════════════════════════════════════════
echo.
echo  Service management (run as Administrator):
echo    Stop   :  net stop MuseumKiosk
echo    Start  :  net start MuseumKiosk
echo    Remove :  sc delete MuseumKiosk
echo.
pause
