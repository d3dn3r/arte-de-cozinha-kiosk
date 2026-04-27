@echo off
:: ─────────────────────────────────────────────────────────────────
::  PACK.bat  —  Arte de Cozinha Kiosk
::  Builds the app and assembles a self-contained release\ folder
::  that can be copied as-is to the tablet (C:\Kiosk\ArteDeCozinha\).
::
::  After copying, on the tablet run INSTALL-SERVICE.bat as Admin.
:: ─────────────────────────────────────────────────────────────────
cd /d "%~dp0"
setlocal

echo.
echo  Arte de Cozinha — Build ^& Pack
echo  ================================
echo.

:: ── Build ────────────────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: npm not found. Install Node.js from https://nodejs.org
  pause & exit /b 1
)

echo  [1/3] Installing dependencies...
call npm install --silent

echo  [2/3] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
  echo  ERROR: Build failed.
  pause & exit /b 1
)

:: ── Assemble release\ ────────────────────────────────────────────
echo  [3/3] Assembling release folder...

if exist release\ (
  rd /s /q release\
)
mkdir release\

:: Copy the built web app
xcopy /s /e /i /q dist\ release\dist\

:: Copy deployment files
copy /y Caddyfile          release\Caddyfile     >nul
copy /y START.bat          release\START.bat      >nul
copy /y INSTALL-SERVICE.bat release\INSTALL-SERVICE.bat >nul

echo.
echo  ✓ Done.  Deployment package is in:  %~dp0release\
echo.
echo  Contents to copy to the tablet (C:\Kiosk\ArteDeCozinha\):
echo    release\dist\
echo    release\Caddyfile
echo    release\START.bat
echo    release\INSTALL-SERVICE.bat
echo.
echo  On the tablet (one-time setup):
echo    1. winget install Caddy.Caddy
echo    2. Right-click INSTALL-SERVICE.bat → Run as administrator
echo    3. Configure Edge kiosk mode to open http://localhost:8080
echo.
pause
