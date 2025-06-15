#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 Cleaning up ports...${NC}"

# Kill any process using port 3024 (backend)
if lsof -ti:3024 >/dev/null 2>&1; then
    echo "Killing process on port 3024..."
    lsof -ti:3024 | xargs kill -9 2>/dev/null || true
fi

# Kill any process using port 5173 (frontend primary)
if lsof -ti:5173 >/dev/null 2>&1; then
    echo "Killing process on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# Kill any process using port 5174 (frontend fallback)
if lsof -ti:5174 >/dev/null 2>&1; then
    echo "Killing process on port 5174..."
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
fi

# Small delay to ensure ports are freed
sleep 1

echo -e "${GREEN}✅ Ports cleaned!${NC}"
echo -e "${YELLOW}🚀 Starting development server...${NC}"

# Start the development server with host flag
npm run dev --host