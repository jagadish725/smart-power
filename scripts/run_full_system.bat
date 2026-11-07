@echo off
TITLE Smart Power Optimization System Launcher
ECHO ==============================================================================
ECHO  SMART POWER OPTIMIZATION SYSTEM USING AI AGENTS - SYSTEM LAUNCHER
ECHO ==============================================================================
ECHO.

REM Navigate to project root
cd /d "%~dp0\.."

ECHO [1/3] Starting Python Flask REST API Backend (Port 5000)...
start "Flask API Backend" cmd /k "backend\venv\Scripts\python backend\app.py"

TIMEOUT /T 3 /NOBREAK >nul

ECHO [2/3] Starting React Vite Frontend Dashboard (Port 3000)...
start "React Vite Dashboard" cmd /k "cd frontend && npm run dev"

TIMEOUT /T 3 /NOBREAK >nul

ECHO [3/3] Opening Web Dashboard in default browser...
start http://localhost:3000

ECHO.
ECHO ==============================================================================
ECHO  SYSTEM LAUNCHED SUCCESSFULLY!
ECHO   * Flask API:  http://localhost:5000/api
ECHO   * Dashboard:  http://localhost:3000
ECHO.
ECHO  To run the ESP32 hardware simulator, open a new terminal and run:
ECHO    backend\venv\Scripts\python scripts\simulate_esp32.py
ECHO ==============================================================================
PAUSE

