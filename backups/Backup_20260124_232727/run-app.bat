@echo off
setlocal

REM Change to the directory where this script resides
cd /d "%~dp0"

REM Verify Node.js is available
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not in PATH.
  echo Download from https://nodejs.org/ and install, then rerun.
  pause
  exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
  echo Installing dependencies...
  npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

REM Determine port to open
set PORT_TO_OPEN=

REM Prefer .env PORT if available
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%i in (".env") do (
    if /i "%%i"=="PORT" set PORT_TO_OPEN=%%j
  )
)

REM Fall back to environment PORT then default 3000
if "%PORT_TO_OPEN%"=="" set PORT_TO_OPEN=%PORT%
if "%PORT_TO_OPEN%"=="" set PORT_TO_OPEN=3000

echo Using port: %PORT_TO_OPEN%

REM Clear any existing process listening on the port
echo Clearing processes on port %PORT_TO_OPEN%...
REM First try PowerShell Get-NetTCPConnection (Win8+)
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $p = Get-NetTCPConnection -LocalPort %PORT_TO_OPEN% -State Listen -ErrorAction Stop ^| Select-Object -Expand OwningProcess -Unique; foreach ($pid in $p) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } } catch { }"

REM Fallback to netstat parsing
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :%PORT_TO_OPEN%') do (
  taskkill /F /PID %%a >nul 2>&1
)

REM Start the server in a new Command Prompt window
echo Starting server with npm start...
start "Flexion & Flow Server" cmd /k "npm start"

REM Give the server a moment, then open the browser
timeout /t 3 /nobreak >nul
start "" http://localhost:%PORT_TO_OPEN%

endlocal
