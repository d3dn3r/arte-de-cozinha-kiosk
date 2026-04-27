@echo off
:: ─────────────────────────────────────────────────────────────────
::  INSTALL-SERVICE.bat  —  Arte de Cozinha Kiosk
::  Registers Caddy as a Windows service that starts automatically
::  at every boot (no login required).
::
::  REQUIREMENTS
::    • Run as Administrator
::    • Caddy installed:  winget install Caddy.Caddy
::
::  SERVICE NAME:  MuseumKiosk
::  To stop  :  net stop MuseumKiosk
::  To remove:  sc delete MuseumKiosk
:: ─────────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion

echo.
echo  Arte de Cozinha — Kiosk Service Installer
echo  ==========================================
echo.

:: ── Check for Administrator ──────────────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: This script must be run as Administrator.
  echo  Right-click the file and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

:: ── Locate caddy ─────────────────────────────────────────────────
for /f "tokens=*" %%C in ('where caddy 2^>nul') do (
  set "CADDY=%%C"
  goto :caddy_found
)
echo  ERROR: caddy.exe not found in PATH.
echo  Install it with:  winget install Caddy.Caddy
echo.
pause & exit /b 1

:caddy_found
:: ── Resolve paths ────────────────────────────────────────────────
set "KIOSK_DIR=%~dp0"
:: Remove trailing backslash for the config path, keep it for KIOSK_DIR
set "CONFIG=%~dp0Caddyfile"
if "!CONFIG:~-1!"=="\" set "CONFIG=!CONFIG:~0,-1!"

echo  Caddy   : !CADDY!
echo  Config  : !CONFIG!
echo  Dist    : !KIOSK_DIR!dist
echo.

:: ── Persist KIOSK_DIR as a machine-wide environment variable ─────
:: Caddy reads {env.KIOSK_DIR} from this when it starts as a service.
setx /M KIOSK_DIR "!KIOSK_DIR!" >nul
echo  [1/4] Set machine env var KIOSK_DIR=!KIOSK_DIR!

:: ── Remove any existing instance ─────────────────────────────────
sc query MuseumKiosk >nul 2>&1
if %errorlevel%==0 (
  echo  [2/4] Removing existing MuseumKiosk service...
  net stop MuseumKiosk >nul 2>&1
  sc delete MuseumKiosk >nul 2>&1
  timeout /t 3 /nobreak >nul
) else (
  echo  [2/4] No existing service to remove.
)

:: ── Create service ───────────────────────────────────────────────
echo  [3/4] Creating service...
sc create "MuseumKiosk" ^
  binPath= "\"!CADDY!\" run --config \"!CONFIG!\"" ^
  DisplayName= "Museum Kiosk (Arte de Cozinha)" ^
  start= auto ^
  obj= LocalSystem
if %errorlevel% neq 0 (
  echo.
  echo  ERROR: sc create failed. Check you are running as Administrator.
  echo.
  pause & exit /b 1
)
sc description "MuseumKiosk" "Caddy web server for Arte de Cozinha flipbook kiosk"

:: ── Start service ────────────────────────────────────────────────
echo  [4/4] Starting service...
net start MuseumKiosk

echo.
echo  Done.
echo.
echo  The kiosk server now starts automatically on every boot.
echo  Open Edge to:  http://localhost:8080
echo.
echo  Service management:
echo    Stop   :  net stop MuseumKiosk
echo    Start  :  net start MuseumKiosk
echo    Remove :  sc delete MuseumKiosk  (then re-run this script to reinstall)
echo.
pause
