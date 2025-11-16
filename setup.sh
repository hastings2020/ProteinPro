#!/bin/bash

# ProteinPro Setup Helper
# Run this script to set up everything needed to run the app

echo "🥩 ProteinPro Setup Helper"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ProteinPro root directory"
    exit 1
fi

echo "Step 1: Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Backend dependencies already installed"
fi
cd ..
echo ""

echo "Step 2: Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${GREEN}✓${NC} Frontend dependencies already installed"
fi
cd ..
echo ""

echo "Step 3: Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓${NC} Backend .env created"
else
    echo -e "${GREEN}✓${NC} Backend .env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓${NC} Frontend .env created"
else
    echo -e "${GREEN}✓${NC} Frontend .env already exists"
fi
echo ""

echo "Step 4: Initializing database..."
if [ ! -f "backend/proteinpro.db" ]; then
    cd backend
    npm run init-db
    cd ..
    echo -e "${GREEN}✓${NC} Database created with sample data"
else
    echo -e "${YELLOW}⚠${NC} Database already exists (keeping existing data)"
fi
echo ""

echo "=========================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================="
echo ""
echo "To start the application:"
echo ""
echo "Option 1 - Use the start script (recommended):"
echo "  ./start.sh"
echo ""
echo "Option 2 - Start manually in two terminals:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
