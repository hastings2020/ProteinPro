#!/bin/bash

# ProteinPro Setup Verification Script
# This script checks if everything is set up correctly

echo "🔍 ProteinPro Setup Verification"
echo "================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "1. Checking Node.js installation..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "   Please install Node.js 14+ from https://nodejs.org/"
    exit 1
fi
echo ""

# Check npm
echo "2. Checking npm installation..."
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm is installed: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi
echo ""

# Check backend dependencies
echo "3. Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies are installed"
else
    echo -e "${YELLOW}⚠${NC} Backend dependencies not found"
    echo "   Run: cd backend && npm install"
fi
echo ""

# Check frontend dependencies
echo "4. Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies are installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not found"
    echo "   Run: cd frontend && npm install"
fi
echo ""

# Check database
echo "5. Checking database..."
if [ -f "backend/proteinpro.db" ]; then
    echo -e "${GREEN}✓${NC} Database file exists"
else
    echo -e "${YELLOW}⚠${NC} Database not found"
    echo "   Run: cd backend && npm run init-db"
fi
echo ""

# Check environment files
echo "6. Checking environment files..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env file not found"
    echo "   Run: cp backend/.env.example backend/.env"
fi

if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend .env file not found"
    echo "   Run: cp frontend/.env.example frontend/.env"
fi
echo ""

# Check if backend is running
echo "7. Checking backend server..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is running on http://localhost:5000"
else
    echo -e "${YELLOW}⚠${NC} Backend is not running"
    echo "   Start it with: cd backend && npm run dev"
fi
echo ""

# Check if frontend is accessible
echo "8. Checking frontend server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running on http://localhost:3000"
else
    echo -e "${YELLOW}⚠${NC} Frontend is not running"
    echo "   Start it with: cd frontend && npm start"
fi
echo ""

# Summary
echo "================================="
echo "Setup Verification Complete!"
echo ""
echo "Next steps:"
echo "1. If backend is not running: cd backend && npm run dev"
echo "2. If frontend is not running: cd frontend && npm start"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For Quick Start: ./start.sh"
echo "For Help: See README.md and QUICKSTART.md"
