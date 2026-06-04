@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ============================================
echo    Vinum AI - Wine Quality Predictor
echo    One-Click Startup
echo ============================================
echo.

:: ---- 1. Check Python ----
python --version >nul 2>&1
if %errorlevel% neq 0 (
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
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)
echo [OK] Python dependencies ready.

:: ---- 4. Train model if needed ----
if not exist "wine_quality_mlp.pt" (
    echo.
    echo [2/3] Model not found, starting training...
    python -m src.train
    if %errorlevel% neq 0 (
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
start "Wine-Quality-API" cmd /c "cd /d %cd% && venv\Scripts\activate && uvicorn src.main:app --host 0.0.0.0 --port 8000"
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
