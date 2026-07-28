#!/bin/bash

# Mobius Ledger v2 - Backend Deployment Script
# 
# This script automates the deployment of the backend server in a production environment.
# Usage: ./scripts/deploy-backend.sh [start|stop|restart|status]

set -e

# Configuration
APP_NAME="mobius-ledger-backend"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backend"
LOG_DIR="$BACKEND_DIR/logs"
PID_FILE="$BACKEND_DIR/$APP_NAME.pid"
ENV_FILE="$BACKEND_DIR/.env"
NODE_BIN="node"
APPJS_PATH="$BACKEND_DIR/src/app.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure we're in the right directory
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to display error and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to check if backend is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            # Process not running but PID file exists
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to get backend status
get_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}$APP_NAME is running (PID: $PID)${NC}"
        return 0
    else
        echo -e "${RED}$APP_NAME is not running${NC}"
        return 1
    fi
}

# Function to start backend
start() {
    echo -e "${YELLOW}Starting $APP_NAME...${NC}"
    
    # Check if already running
    if is_running; then
        error_exit "$APP_NAME is already running"
    fi
    
    # Create directories if they don't exist
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKEND_DIR/temp"
    
    # Create .env file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        echo "# Mobius Ledger Backend Environment Configuration" > "$ENV_FILE"
        echo "NODE_ENV=production" >> "$ENV_FILE"
        echo "PORT=3000" >> "$ENV_FILE"
        echo "# DATABASE_PATH=../database/mobius_ledger.db" >> "$ENV_FILE"
        echo "# SESSION_SECRET=your-strong-secret-here" >> "$ENV_FILE"
        echo -e "${YELLOW}Created default .env file. Please customize it for your environment.${NC}"
    fi
    
    # Start the backend with forever or node
    if command -v forever &> /dev/null; then
        forever start -a -l "$LOG_DIR/backend.log" -o "$LOG_DIR/backend-out.log" -e "$LOG_DIR/backend-err.log" --pidFile "$PID_FILE" -c "$NODE_BIN" "$APPJS_PATH"
    else
        nohup $NODE_BIN "$APPJS_PATH" > "$LOG_DIR/backend.log" 2>&1 &
        echo $! > "$PID_FILE"
    fi
    
    echo -e "${GREEN}$APP_NAME started successfully${NC}"
    echo "PID: $(cat "$PID_FILE")"
    echo "Logs: $LOG_DIR/backend.log"
    echo "API: http://localhost:$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | head -1)"
}

# Function to stop backend
stop() {
    echo -e "${YELLOW}Stopping $APP_NAME...${NC}"
    
    if ! is_running; then
        echo -e "${YELLOW}$APP_NAME is not running${NC}"
        return 0
    fi
    
    PID=$(cat "$PID_FILE")
    
    if command -v forever &> /dev/null; then
        forever stop "$APPJS_PATH" || true
    else
        kill "$PID" || true
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}$APP_NAME stopped successfully${NC}"
}

# Function to restart backend
restart() {
    echo -e "${YELLOW}Restarting $APP_NAME...${NC}"
    stop
    sleep 2
    start
}

# Main script logic
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        get_status
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|status]"
        echo ""
        echo "Commands:"
        echo "  start   - Start the backend server"
        echo "  stop    - Stop the backend server"
        echo "  restart - Restart the backend server"
        echo "  status  - Check if the backend server is running"
        exit 1
        ;;
esac

exit 0
