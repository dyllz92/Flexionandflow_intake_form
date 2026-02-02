@echo off
echo Starting Flexion and Flow Intake Form...
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting server in development mode (auto-restarts on changes)...
echo Access the app at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
