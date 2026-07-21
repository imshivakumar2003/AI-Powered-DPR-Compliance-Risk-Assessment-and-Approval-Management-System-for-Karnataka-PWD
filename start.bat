@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   AI-Powered DPR Analysis Platform - Startup Script
echo   MDoNER Smart Assessment Portal
echo ========================================================
echo.

:: 1. Check Prerequisites
echo [1/6] Checking system requirements...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python (https://www.python.org/downloads/) and try again.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (https://nodejs.org/) and try again.
    pause
    exit /b 1
)
echo       Prerequisites found: Python and Node.js.
echo.

:: 2. Kill any previous instances
echo [2/6] Cleaning up old processes on ports 3000 and 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done.
echo.

:: 3. Setup Backend (Virtual Environment + Dependencies)
echo [3/6] Setting up Backend...
cd /d "%~dp0Backend"

if not exist "venv" (
    echo       Creating Python virtual environment...
    python -m venv venv
)

echo       Installing/Updating Python dependencies...
call venv\Scripts\activate
pip install -r requirements.txt -q
echo       Backend setup complete.
echo.

:: 4. Setup Frontend
echo [4/6] Setting up Frontend...
cd /d "%~dp0Frontend"

if not exist "node_modules" (
    echo       Installing npm packages (this might take a minute)...
    call npm install
) else (
    echo       Verifying npm packages...
    call npm install --silent >nul 2>&1
)
echo       Frontend setup complete.
echo.

:: 5. Start Backend
echo [5/6] Starting Backend API...
start "DPR-AI Backend" cmd /c "cd /d %~dp0Backend && call venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
echo       Backend started on port 8000.
echo.

:: 6. Start Frontend
echo [6/6] Starting Frontend...
start "DPR-AI Frontend" cmd /c "cd /d %~dp0Frontend && npm run dev"
timeout /t 5 /nobreak >nul
echo       Frontend started on port 3000.
echo.

echo ========================================================
echo   All services are running successfully!
echo.
echo   Frontend (App):  http://localhost:3000
echo   Backend (API):   http://localhost:8000/docs
echo.
echo   Master Admin:    admin / admin
echo   Test User:       test / 1234
echo   Requester User:  user / user
echo ========================================================
echo.
echo Press any key to open the app in your default browser...
pause >nul
start http://localhost:3000
