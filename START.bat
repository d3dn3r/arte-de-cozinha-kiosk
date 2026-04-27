@echo off
:: ─────────────────────────────────────────────────────────────────
::  START.bat  —  Arte de Cozinha Kiosk
::  Launches Caddy in the foreground for testing.
::  Close this window (or Ctrl+C) to stop the server.
::  For a permanent auto-start service run INSTALL-SERVICE.bat instead.
:: ─────────────────────────────────────────────────────────────────
cd /d "%~dp0"

:: KIOSK_DIR must end with a backslash so {env.KIOSK_DIR}dist resolves correctly
set "KIOSK_DIR=%~dp0"

where caddy >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  ERROR: caddy.exe not found in PATH.
  echo  Install it with:  winget install Caddy.Caddy
  echo.
  pause
  exit /b 1
)

echo.
echo  Arte de Cozinha — Museum Kiosk
echo  Serving on http://localhost:8080
echo  Press Ctrl+C to stop.
echo.

caddy run --config Caddyfile
