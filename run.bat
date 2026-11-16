@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found. Install from https://nodejs.org/
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo ERROR: pnpm not found. Run setup.bat first or: npm install -g pnpm
  exit /b 1
)

if not exist "node_modules\" (
  echo node_modules missing. Run setup.bat first.
  exit /b 1
)

echo Starting Seerr development server ^(Ctrl+C to stop^)...
echo.
call pnpm dev
