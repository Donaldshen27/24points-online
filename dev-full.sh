#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start backend server in background
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd "$SCRIPT_DIR/server" && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${YELLOW}🚀 Starting frontend server...${NC}"
cd "$SCRIPT_DIR/client" && npm run dev --host &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Both servers started!${NC}"
echo -e "${YELLOW}Backend PID: $BACKEND_PID${NC}"
echo -e "${YELLOW}Frontend PID: $FRONTEND_PID${NC}"
echo -e "${RED}Press Ctrl+C to stop both servers${NC}"

# Function to handle cleanup
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID