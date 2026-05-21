@echo off
setlocal
cd /d "%~dp0"

echo === Seerr Windows setup ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found in PATH.
  echo Install Node.js LTS from https://nodejs.org/ then run this script again.
  exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODEV=%%i
echo Found %NODEV%

where pnpm >nul 2>&1
if errorlevel 1 (
  echo pnpm not found; trying Corepack ^(ships with Node 16.13+^)...
  where corepack >nul 2>&1
  if errorlevel 1 (
    echo ERROR: Install pnpm globally:  npm install -g pnpm
    exit /b 1
  )
  call corepack enable
  if errorlevel 1 (
    echo ERROR: corepack enable failed.
    exit /b 1
  )
  call corepack prepare pnpm@10.24.0 --activate
  if errorlevel 1 (
    echo ERROR: Could not activate pnpm. Try: npm install -g pnpm@10.24.0
    exit /b 1
  )
)

for /f "tokens=*" %%i in ('pnpm -v') do set PNPMV=%%i
echo Using pnpm %PNPMV%
echo.

echo Running pnpm install...
call pnpm install
if errorlevel 1 (
  echo ERROR: pnpm install failed.
  exit /b 1
)

echo.
echo === Setup finished ===
echo Next:  pnpm dev     ^(development server^)
echo        pnpm build   ^(production build^)
echo        pnpm test    ^(run tests^)
exit /b 0
