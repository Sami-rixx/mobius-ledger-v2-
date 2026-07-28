#!/bin/bash

# Mobius Ledger v2 - Frontend Deployment Script
# 
# This script automates the deployment of the frontend in a production environment.
# Usage: ./scripts/deploy-frontend.sh [build|serve|deploy]

set -e

# Configuration
APP_NAME="mobius-ledger-frontend"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backend"
LOG_DIR="$FRONTEND_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure we're in the right directory
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to display error and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to build frontend
build() {
    echo -e "${YELLOW}Building $APP_NAME for production...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install --production
    fi
    
    # Run production build
    echo -e "${BLUE}Running vite build...${NC}"
    npm run build
    
    echo -e "${GREEN}$APP_NAME built successfully${NC}"
    echo "Build output: $DIST_DIR"
    echo ""
    ls -lh "$DIST_DIR"/ | head -10
}

# Function to serve the production build
serve() {
    local port=${1:-5173}
    
    echo -e "${YELLOW}Serving $APP_NAME production build...${NC}"
    
    cd "$FRONTEND_DIR"
    
    # Check if build exists
    if [ ! -d "$DIST_DIR" ]; then
        echo -e "${YELLOW}No build found. Building first...${NC}"
        build
    fi
    
    # Create logs directory
    mkdir -p "$LOG_DIR"
    
    # Serve using vite preview or a simple server
    if command_exists "npm"; then
        echo -e "${BLUE}Starting vite preview server on port $port...${NC}"
        echo "Press Ctrl+C to stop"
        npm run preview -- --port "$port"
    elif command_exists "python3"; then
        echo -e "${BLUE}Starting Python HTTP server on port $port...${NC}"
        echo "Press Ctrl+C to stop"
        cd "$DIST_DIR"
        python3 -m http.server "$port"
    elif command_exists "python"; then
        echo -e "${BLUE}Starting Python HTTP server on port $port...${NC}"
        echo "Press Ctrl+C to stop"
        cd "$DIST_DIR"
        python -m SimpleHTTPServer "$port"
    else
        error_exit "No suitable server found. Install Node.js or Python."
    fi
}

# Function to deploy (build and serve)
deploy() {
    local port=${1:-5173}
    
    echo -e "${YELLOW}Deploying $APP_NAME...${NC}"
    
    build
    echo ""
    serve "$port"
}

# Function to show deployment information
info() {
    echo -e "${BLUE}$APP_NAME Deployment Information${NC}"
    echo ""
    echo "Frontend Directory: $FRONTEND_DIR"
    echo "Build Directory:   $DIST_DIR"
    echo "Backend Directory:  $BACKEND_DIR"
    echo ""
    
    if [ -d "$DIST_DIR" ]; then
        echo -e "${GREEN}Build exists${NC}"
        echo "Build size: $(du -sh "$DIST_DIR" | cut -f1)"
        echo "Build date: $(stat -c %y "$DIST_DIR" | cut -d' ' -f1)"
    else
        echo -e "${YELLOW}No build found${NC}"
    fi
    
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV=production"
    echo "  PORT=5173 (or custom)"
    echo ""
    echo "To deploy:"
    echo "  ./scripts/deploy-frontend.sh deploy"
}

# Main script logic
case "$1" in
    build)
        build
        ;;
    serve)
        serve "${2:-5173}"
        ;;
    deploy)
        deploy "${2:-5173}"
        ;;
    info)
        info
        ;;
    *)
        echo "Usage: $0 [build|serve|deploy|info]"
        echo ""
        echo "Commands:"
        echo "  build   - Build the frontend for production"
        echo "  serve [port]  - Serve the production build (default: 5173)"
        echo "  deploy [port] - Build and serve the production build"
        echo "  info    - Show deployment information"
        exit 1
        ;;
esac

exit 0
