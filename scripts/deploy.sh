#!/bin/bash

# Mobius Ledger v2 - Master Deployment Script
# 
# This script provides a unified interface for deploying the entire application.
# Usage: ./scripts/deploy.sh [backend|frontend|full|status|stop]

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_BACKEND_SCRIPT="$PROJECT_DIR/scripts/deploy-backend.sh"
DEPLOY_FRONTEND_SCRIPT="$PROJECT_DIR/scripts/deploy-frontend.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure we're in the right directory
cd "$PROJECT_DIR"

# Function to display error and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to check if a script exists
script_exists() {
    [ -f "$1" ] && [ -x "$1" ]
}

# Function to deploy backend
deploy_backend() {
    if script_exists "$DEPLOY_BACKEND_SCRIPT"; then
        echo -e "${BLUE}Deploying Backend...${NC}"
        "$DEPLOY_BACKEND_SCRIPT" start
    else
        error_exit "Backend deployment script not found: $DEPLOY_BACKEND_SCRIPT"
    fi
}

# Function to deploy frontend
deploy_frontend() {
    local port=${1:-5173}
    
    if script_exists "$DEPLOY_FRONTEND_SCRIPT"; then
        echo -e "${BLUE}Deploying Frontend...${NC}"
        "$DEPLOY_FRONTEND_SCRIPT" build
    else
        error_exit "Frontend deployment script not found: $DEPLOY_FRONTEND_SCRIPT"
    fi
}

# Function to deploy full application
deploy_full() {
    local frontend_port=${1:-5173}
    
    echo -e "${YELLOW}Deploying Full Mobius Ledger v2 Application...${NC}"
    echo ""
    
    # Deploy backend
    deploy_backend
    echo ""
    
    # Deploy frontend
    deploy_frontend "$frontend_port"
    echo ""
    
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo ""
    echo "Backend:  http://localhost:3000"
    echo "Frontend: http://localhost:$frontend_port"
    echo ""
    echo "To stop all services: ./scripts/deploy.sh stop"
}

# Function to check status
check_status() {
    echo -e "${BLUE}Checking Deployment Status...${NC}"
    echo ""
    
    if script_exists "$DEPLOY_BACKEND_SCRIPT"; then
        echo -e "${YELLOW}Backend Status:${NC}"
        "$DEPLOY_BACKEND_SCRIPT" status || true
    fi
    
    echo ""
    
    if script_exists "$DEPLOY_FRONTEND_SCRIPT"; then
        echo -e "${YELLOW}Frontend Status:${NC}"
        "$DEPLOY_FRONTEND_SCRIPT" info || true
    fi
}

# Function to stop all services
stop_all() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    if script_exists "$DEPLOY_BACKEND_SCRIPT"; then
        echo -e "${BLUE}Stopping Backend...${NC}"
        "$DEPLOY_BACKEND_SCRIPT" stop || true
    fi
    
    # Note: Frontend is typically served statically, so no need to stop it
    # Just remove the build or stop the server if running
    
    echo -e "${GREEN}All services stopped${NC}"
}

# Function to show help
how_to_deploy() {
    echo -e "${BLUE}Mobius Ledger v2 - Deployment Guide${NC}"
    echo ""
    echo "Quick Start:"
    echo "  1. Backend only:   ./scripts/deploy.sh backend"
    echo "  2. Frontend only:  ./scripts/deploy.sh frontend [port]"
    echo "  3. Full deploy:    ./scripts/deploy.sh full [port]"
    echo ""
    echo "Commands:"
    echo "  backend      - Start the backend server"
    echo "  frontend [port] - Build the frontend (default: 5173)"
    echo "  full [port]     - Deploy both backend and frontend"
    echo "  status        - Check deployment status"
    echo "  stop          - Stop all services"
    echo ""
    echo "Environment Setup:"
    echo "  1. Copy backend/deploy.config.js to backend/config/production.js"
    echo "  2. Customize the production configuration"
    echo "  3. Set environment variables in backend/.env"
    echo "  4. Run the deployment script"
    echo ""
    echo "Production Environment Variables:"
    echo "  PORT              - Backend port (default: 3000)"
    echo "  NODE_ENV         - Node.js environment (default: production)"
    echo "  DATABASE_PATH     - Database file path"
    echo "  SESSION_SECRET   - Session secret key"
    echo "  LOG_LEVEL        - Logging level (error, warn, info, verbose, debug)"
    echo ""
}

# Main script logic
case "$1" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend "${2:-5173}"
        ;;
    full)
        deploy_full "${2:-5173}"
        ;;
    status)
        check_status
        ;;
    stop)
        stop_all
        ;;
    help|--help|-h)
        how_to_deploy
        ;;
    *)
        echo "Usage: $0 [backend|frontend|full|status|stop|help]"
        echo ""
        echo "Try: $0 help"
        exit 1
        ;;
esac

exit 0
