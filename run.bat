@echo off
echo ==================================================
echo   FUTUREME BACKEND AUTO-INSTALLER & RUNNER (PYTHON)
echo ==================================================
echo.

:: Check if Python is in path
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to your system PATH.
    echo Please download and install Python from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b %errorlevel%
)

echo [1/2] Installing required Python libraries (Flask, dotenv, google-genai)...
echo.
pip install flask flask-cors google-generativeai python-dotenv
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies. Check your internet connection or pip configurations.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Launching FutureMe server on http://localhost:5000...
echo.
cd backend
python server.py
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server crashed or closed unexpectedly.
    echo.
    pause
)
