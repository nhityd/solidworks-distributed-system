@echo off
REM Hybrid Node Mode Management Dashboard - Windows Startup Script
setlocal enabledelayedexpansion

REM UTF-8対応
chcp 65001 >nul 2>&1

REM タイトル設定
title Hybrid Node Mode Management Dashboard

REM クリア
cls

REM タイトル表示
echo.
echo ============================================================
echo  Hybrid Node Mode Management Dashboard
echo  Mode Management Dashboard
echo ============================================================
echo.

REM Node.js確認
echo Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo SUCCESS: Node.js %NODE_VERSION%

REM npm確認
echo Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo SUCCESS: npm %NPM_VERSION%

echo.
echo Checking dependencies...
echo.

REM package.json確認
if not exist package.json (
    echo ERROR: package.json not found
    echo Please run this script in the project directory
    pause
    exit /b 1
)

REM node_modules確認
if not exist node_modules (
    echo WARN: node_modules not found. Running npm install...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERROR: npm install failed
        echo Please check your internet connection
        pause
        exit /b 1
    )
    echo SUCCESS: Dependencies installed
) else (
    echo SUCCESS: Dependencies already installed
)

echo.
echo System ready to start!
echo.

REM メニュー表示
echo ============================================================
echo.
echo Select a mode:
echo.
echo   1) Development (dev)     - Development with hot reload
echo   2) Test (test)           - Run unit tests
echo   3) Build (build)         - Build for production
echo   4) Type Check            - TypeScript type check
echo   5) Linting               - Code quality check
echo   6) Exit
echo.
echo ============================================================
echo.

set /p choice="Select [1-6, default: 1]: "
if "%choice%"=="" set choice=1

echo.

if "%choice%"=="1" (
    echo Starting development server...
    echo.
    echo ============================================================
    echo Development server started
    echo.
    echo   Open in browser: http://localhost:3000
    echo   Auto-reload on file save
    echo   Exit: Press Ctrl+C
    echo.
    echo ============================================================
    echo.
    call npm run dev
) else if "%choice%"=="2" (
    echo Running tests...
    echo.
    call npm test
) else if "%choice%"=="3" (
    echo Starting production build...
    echo.
    call npm run build
    echo.
    echo SUCCESS: Build completed!
    echo Check the dist/ directory
) else if "%choice%"=="4" (
    echo TypeScript type check...
    echo.
    call npm run typecheck
) else if "%choice%"=="5" (
    echo Running linting...
    echo.
    call npm run lint
) else if "%choice%"=="6" (
    echo Exiting
    exit /b 0
) else (
    echo ERROR: Invalid selection. Please choose 1-6
    pause
    exit /b 1
)

echo.
echo Process completed!
echo.
pause
