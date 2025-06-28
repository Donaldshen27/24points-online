#!/bin/bash

# MCP Server Setup Script
# Sets up all MCP servers mentioned in the Claude Code MCP documentation

set -e

echo "Setting up MCP servers for Claude Code..."
echo "========================================="

# 1. Context7 MCP Server (HTTP transport)
echo -e "\n1. Setting up Context7 (HTTP)..."
claude mcp add --transport http context7 https://mcp.context7.com/mcp || echo "Failed to add Context7 HTTP server"

# 2. Context7 MCP Server (SSE transport alternative)
echo -e "\n2. Setting up Context7 (SSE)..."
claude mcp add --transport sse context7-sse https://mcp.context7.com/sse || echo "Failed to add Context7 SSE server"

# 3. Context7 MCP Server (Local via NPX)
echo -e "\n3. Setting up Context7 (Local)..."
claude mcp add context7-local -- npx -y @upstash/context7-mcp || echo "Failed to add Context7 local server"

# 4. Sequential Thinking Server
echo -e "\n4. Setting up Sequential Thinking server..."
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking || echo "Failed to add Sequential Thinking server"

# 5. Puppeteer Server (Docker version)
echo -e "\n5. Setting up Puppeteer server (Docker)..."
# Check if Docker is installed
if command -v docker &> /dev/null; then
    claude mcp add puppeteer -- docker run -i --rm --init -e DOCKER_CONTAINER=true mcp/puppeteer || echo "Failed to add Puppeteer Docker server"
else
    echo "Docker not found. Skipping Puppeteer Docker setup."
fi

# 6. Fetch Server (using uvx)
echo -e "\n6. Setting up Fetch server..."
# Check if uvx is installed
if command -v uvx &> /dev/null; then
    claude mcp add fetch -- uvx mcp-server-fetch || echo "Failed to add Fetch server"
else
    echo "uvx not found. Attempting to install via pip..."
    pip install --user uvx 2>/dev/null || echo "Could not install uvx. Skipping Fetch server setup."
    if command -v uvx &> /dev/null; then
        claude mcp add fetch -- uvx mcp-server-fetch || echo "Failed to add Fetch server"
    fi
fi

# 7. Example servers from documentation (commented out as they use placeholder paths)
echo -e "\n7. Example servers (using placeholder commands for demonstration)..."
echo "Note: These are examples and may need real paths/commands to work properly"

# Generic local server example
# claude mcp add my-local-server -- /path/to/server arg1 arg2

# Server with environment variables
# claude mcp add my-server -e API_KEY=your_actual_key -- /path/to/server

# List all configured servers
echo -e "\n========================================="
echo "Setup complete! Listing all configured MCP servers:"
echo ""
claude mcp list

echo -e "\n========================================="
echo "Tips:"
echo "- Use 'claude mcp list' to see all configured servers"
echo "- Use 'claude mcp get <server-name>' to see details for a specific server"
echo "- Use 'claude mcp remove <server-name>' to remove a server"
echo "- Use '/mcp' within Claude Code to check server status and authenticate"
echo ""
echo "Note: Some servers may require additional setup:"
echo "- Docker servers require Docker to be installed and running"
echo "- NPX servers will download packages on first run"
echo "- Remote servers may require authentication via '/mcp' command"