@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================
echo    Vinum AI - Wine Quality Predictor
echo    One-Click Startup
echo ============================================
echo.

:: ---- 1. Locate Python (prefer the project virtual environment) ----
set "PYTHON_EXE="
if exist "backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0backend\venv\Scripts\python.exe"
) else (
    py -3 --version >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYTHON_EXE=py -3"
    ) else (
        python --version >nul 2>&1
        if !errorlevel! equ 0 set "PYTHON_EXE=python"
    )
)
if not defined PYTHON_EXE (
    echo [ERROR] Python not found. Please install Python 3.9+.
    pause
    exit /b 1
)

:: ---- 2. Check Node.js ----
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+.
    pause
    exit /b 1
)

:: ---- 3. Install Python dependencies ----
echo [1/3] Checking Python dependencies...
cd backend
if not exist "venv\" (
    echo Creating Python virtual environment...
    %PYTHON_EXE% -m venv venv
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create Python virtual environment.
        pause
        exit /b 1
    )
    set "PYTHON_EXE=%cd%\venv\Scripts\python.exe"
)
"%PYTHON_EXE%" -m pip install -q -r requirements.txt
if !errorlevel! neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)
echo [OK] Python dependencies ready.

:: ---- 4. Train model if needed ----
if not exist "wine_quality_mlp.pt" (
    echo.
    echo [2/3] Model not found, starting training...
    "%PYTHON_EXE%" -m src.train
    if !errorlevel! neq 0 (
        echo [ERROR] Training failed.
        pause
        exit /b 1
    )
    echo [OK] Training completed.
) else (
    echo [2/3] Model already exists, skipping training.
)

:: ---- 5. Start backend ----
echo.
echo [3/3] Starting services...
start "Wine-Quality-API" /D "%cd%" "%PYTHON_EXE%" -m uvicorn src.main:app --host 0.0.0.0 --port 8000

:: Wait for FastAPI to become reachable instead of reporting success immediately.
powershell -NoProfile -Command "$ready=$false; 1..15 | ForEach-Object { try { $response=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/' -TimeoutSec 1; if ($response.StatusCode -eq 200 -and $response.Content -match 'Wine Quality Prediction API') { $ready=$true; break } } catch {}; Start-Sleep -Seconds 1 }; if (-not $ready) { exit 1 }"
if !errorlevel! neq 0 (
    echo [ERROR] FastAPI backend failed to start on port 8000.
    echo         Check whether port 8000 is occupied, then review the Wine-Quality-API window.
    pause
    exit /b 1
)
echo [OK] FastAPI backend started on http://localhost:8000

:: ---- 6. Install & start frontend ----
cd ..\frontend
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    call npm install
)
start "Wine-Quality-Frontend" cmd /c "cd /d %cd% && npm run dev"
echo [OK] Frontend started on http://localhost:3000

echo.
echo ============================================
echo   Both servers are running!
echo   Open http://localhost:3000 in your browser
echo ============================================
echo.
echo Press any key to stop all servers...
pause >nul

taskkill /FI "WINDOWTITLE eq Wine-Quality-API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Wine-Quality-Frontend*" /F >nul 2>&1
echo Servers stopped.
endlocal
