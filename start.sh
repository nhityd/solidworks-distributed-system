#!/bin/bash

# Hybrid Node Mode Management Dashboard - Startup Script

# Clear screen
clear

# Display title
echo ""
echo "============================================================"
echo "  Hybrid Node Mode Management Dashboard"
echo "  Mode Management Dashboard"
echo "============================================================"
echo ""

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "SUCCESS: Node.js $NODE_VERSION"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "SUCCESS: npm $NPM_VERSION"

echo ""
echo "Checking dependencies..."
echo ""

# Check package.json
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Please run this script in the project directory"
    exit 1
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "WARN: node_modules not found. Running npm install..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "ERROR: npm install failed"
        echo "Please check your internet connection"
        exit 1
    fi
    echo "SUCCESS: Dependencies installed"
else
    echo "SUCCESS: Dependencies already installed"
fi

echo ""
echo "System ready to start!"
echo ""

# Display menu
echo "============================================================"
echo ""
echo "Select a mode:"
echo ""
echo "  1) Development (dev)     - Development with hot reload"
echo "  2) Test (test)           - Run unit tests"
echo "  3) Build (build)         - Build for production"
echo "  4) Type Check            - TypeScript type check"
echo "  5) Linting               - Code quality check"
echo "  6) Exit"
echo ""
echo "============================================================"
echo ""

# Get user input
read -p "Select [1-6, default: 1]: " choice
choice=${choice:-1}

echo ""

case $choice in
    1)
        echo "Starting development server..."
        echo ""
        echo "============================================================"
        echo "Development server started"
        echo ""
        echo "  Open in browser: http://localhost:3000"
        echo "  Auto-reload on file save"
        echo "  Exit: Press Ctrl+C"
        echo ""
        echo "============================================================"
        echo ""
        npm run dev
        ;;
    2)
        echo "Running tests..."
        echo ""
        npm test
        ;;
    3)
        echo "Starting production build..."
        echo ""
        npm run build
        echo ""
        echo "SUCCESS: Build completed!"
        echo "Check the dist/ directory"
        ;;
    4)
        echo "TypeScript type check..."
        echo ""
        npm run typecheck
        ;;
    5)
        echo "Running linting..."
        echo ""
        npm run lint
        ;;
    6)
        echo "Exiting"
        exit 0
        ;;
    *)
        echo "ERROR: Invalid selection. Please choose 1-6"
        exit 1
        ;;
esac

echo ""
echo "Process completed!"
