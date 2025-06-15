#!/bin/bash

# Kill any process using port 3024 (backend)
echo "Cleaning up port 3024..."
lsof -ti:3024 | xargs kill -9 2>/dev/null || true

# Small delay to ensure port is freed
sleep 1

# Start the development server with host flag
echo "Starting development server..."
npm run dev --host