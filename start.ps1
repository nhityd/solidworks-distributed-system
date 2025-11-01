# Hybrid Node Mode Management Dashboard - PowerShell Startup Script
# Error handling included

# UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Set error handling
$ErrorActionPreference = "Continue"

# Set window title
$Host.UI.RawUI.WindowTitle = "Hybrid Node Mode Management Dashboard"

# Clear screen
Clear-Host

# Display title
Write-Host ""
Write-Host "============================================================"
Write-Host "  Hybrid Node Mode Management Dashboard"
Write-Host "  Mode Management Dashboard"
Write-Host "============================================================"
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..."
try {
    $nodeCheck = node -v 2>$null
    if (-not $nodeCheck) {
        Write-Host "ERROR: Node.js is not installed"
        Write-Host "Please install from https://nodejs.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "SUCCESS: Node.js $nodeCheck"
} catch {
    Write-Host "ERROR: Node.js is not installed"
    Write-Host "Please install from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
Write-Host "Checking npm..."
try {
    $npmCheck = npm -v 2>$null
    if (-not $npmCheck) {
        Write-Host "ERROR: npm is not installed"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "SUCCESS: npm $npmCheck"
} catch {
    Write-Host "ERROR: npm is not installed"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Checking dependencies..."
Write-Host ""

# Check package.json
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found"
    Write-Host "Please run this script in the project directory"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "WARN: node_modules not found. Running npm install..."
    Write-Host ""
    npm install --legacy-peer-deps

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed"
        Write-Host "Please check your internet connection"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "SUCCESS: Dependencies installed"
} else {
    Write-Host "SUCCESS: Dependencies already installed"
}

Write-Host ""
Write-Host "System ready to start!"
Write-Host ""

# Display menu
Write-Host "============================================================"
Write-Host ""
Write-Host "Select a mode:"
Write-Host ""
Write-Host "  1) Development (dev)     - Development with hot reload"
Write-Host "  2) Test (test)           - Run unit tests"
Write-Host "  3) Build (build)         - Build for production"
Write-Host "  4) Type Check            - TypeScript type check"
Write-Host "  5) Linting               - Code quality check"
Write-Host "  6) Exit"
Write-Host ""
Write-Host "============================================================"
Write-Host ""

# Get user input
$choice = Read-Host "Select [1-6, default: 1]"
if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = "1"
}

Write-Host ""

# Process selection
switch ($choice) {
    "1" {
        Write-Host "Starting development server..."
        Write-Host ""
        Write-Host "============================================================"
        Write-Host "Development server started"
        Write-Host ""
        Write-Host "  Open in browser: http://localhost:3000"
        Write-Host "  Auto-reload on file save"
        Write-Host "  Exit: Press Ctrl+C"
        Write-Host ""
        Write-Host "============================================================"
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Host "Running tests..."
        Write-Host ""
        npm test
    }
    "3" {
        Write-Host "Starting production build..."
        Write-Host ""
        npm run build
        Write-Host ""
        Write-Host "SUCCESS: Build completed!"
        Write-Host "Check the dist/ directory"
    }
    "4" {
        Write-Host "TypeScript type check..."
        Write-Host ""
        npm run typecheck
    }
    "5" {
        Write-Host "Running linting..."
        Write-Host ""
        npm run lint
    }
    "6" {
        Write-Host "Exiting"
        exit 0
    }
    default {
        Write-Host "ERROR: Invalid selection. Please choose 1-6"
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Process completed!"
Write-Host ""
Read-Host "Press Enter to exit"
