#!/bin/bash

###############################################################################
# Crime Reporting & Analysis System - Startup Script (macOS/Linux)
#
# Usage:
#   ./start.sh                 (start all services, open browser)
#   ./start.sh --no-browser    (start all services, no browser)
#
# This script:
#  1. Checks and installs dependencies if needed (Node for client/server,
#     Python venv for the optional analysis/ service)
#  2. Verifies/creates server/.env
#  3. Creates the uploads/ folder if missing (evidence attachments)
#  4. Starts backend, frontend, and analysis (if present) with health
#     checks - skips any service that's already running
#  5. Optionally opens browser
#  6. Cleans up every process on exit / Ctrl+C, so re-running never
#     collides with a leftover process on the same port
#
# The analysis/ (Python/Flask) service is optional - if that folder
# doesn't exist yet, this script just skips it and runs client+server
# as before.
#
# For Windows (or anywhere without bash), run: node start.js
###############################################################################

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CLIENT_DIR="$SCRIPT_DIR"
SERVER_DIR="$PROJECT_DIR/server"
ANALYSIS_DIR="$PROJECT_DIR/analysis"
BACKEND_PORT=5001
FRONTEND_PORT=3000
ANALYSIS_PORT=5002

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color

# Logging functions
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }
port_responds()  { curl -s "http://localhost:$1/" >/dev/null 2>&1; }

SERVER_PID=""
CLIENT_PID=""
ANALYSIS_PID=""

# Kill a background job AND anything it spawned (npm start spawns node as a
# child, and killing only the npm PID often leaves that child running).
kill_tree() {
  local pid="$1"
  [ -z "$pid" ] && return
  pkill -P "$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null || true
}

# Always runs when the script exits, however it exits, so a leftover
# process on 5001/3000/5002 can never block the *next* run.
cleanup() {
  info ""
  info "Shutting down..."
  kill_tree "$SERVER_PID"
  kill_tree "$CLIENT_PID"
  kill_tree "$ANALYSIS_PID"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'error "Script failed at line $LINENO"; exit 1' ERR

###############################################################################
# PREFLIGHT CHECKS
###############################################################################

info "====================================="
info "Crime Reporting & Analysis System"
info "====================================="
info ""

if ! command_exists node; then
  error "Node.js not installed. Please install from https://nodejs.org/"
  exit 1
fi

if ! command_exists npm; then
  error "npm not installed. Please install Node.js (includes npm)."
  exit 1
fi

if ! command_exists curl; then
  error "curl not found. Please install curl (used for health checks)."
  exit 1
fi

info "Node.js $(node --version)"
info "npm $(npm --version)"

# Python is only needed if the analysis/ service exists - detect but don't
# fail the whole script if it's missing, just skip that service later.
PYTHON_BIN=""
if command_exists python3; then
  PYTHON_BIN="python3"
elif command_exists python; then
  PYTHON_BIN="python"
fi
if [ -d "$ANALYSIS_DIR" ]; then
  if [ -n "$PYTHON_BIN" ]; then
    info "$($PYTHON_BIN --version 2>&1)"
  else
    warning "analysis/ folder found but no Python interpreter on PATH - that service will be skipped."
  fi
fi
info ""

###############################################################################
# INSTALL DEPENDENCIES
###############################################################################

info "Checking dependencies..."

if [ ! -d "$SERVER_DIR/node_modules" ]; then
  warning "Backend dependencies not installed."
  info "Running npm install in server/"
  (cd "$SERVER_DIR" && npm install)
  success "Backend dependencies installed."
else
  info "Backend dependencies already installed."
fi

if [ ! -d "$CLIENT_DIR/node_modules" ]; then
  warning "Frontend dependencies not installed."
  info "Running npm install in client/"
  (cd "$CLIENT_DIR" && npm install)
  success "Frontend dependencies installed."
else
  info "Frontend dependencies already installed."
fi

if [ -d "$ANALYSIS_DIR" ] && [ -n "$PYTHON_BIN" ]; then
  if [ ! -d "$ANALYSIS_DIR/venv" ]; then
    warning "Analysis service dependencies not installed."
    info "Creating virtual environment and installing requirements..."
    (cd "$ANALYSIS_DIR" && "$PYTHON_BIN" -m venv venv && ./venv/bin/pip install --quiet -r requirements.txt)
    success "Analysis service dependencies installed."
  else
    info "Analysis service dependencies already installed."
  fi
fi

info ""

###############################################################################
# SETUP SERVER .ENV
###############################################################################

info "Checking server/.env..."

if [ ! -f "$SERVER_DIR/.env" ]; then
  warning "server/.env not found."
  if [ -f "$SERVER_DIR/.env.example" ]; then
    info "Copying from .env.example..."
    cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
    success "Created server/.env from .env.example"
  else
    info "Creating default server/.env..."
    echo "PORT=$BACKEND_PORT" > "$SERVER_DIR/.env"
    success "Created default server/.env (PORT only - add DB/secret vars here if your backend needs them)"
  fi
else
  info "server/.env exists."
fi

info ""

###############################################################################
# UPLOADS FOLDER (evidence attachments - not tracked by git when empty)
###############################################################################

if [ ! -d "$PROJECT_DIR/uploads" ]; then
  info "Creating uploads/ folder..."
  mkdir -p "$PROJECT_DIR/uploads"
fi

###############################################################################
# START BACKEND
###############################################################################

if port_responds "$BACKEND_PORT"; then
  warning "Something is already responding on port $BACKEND_PORT - assuming backend is already running, skipping start."
else
  info "Starting backend (Node.js, port $BACKEND_PORT)..."
  (cd "$SERVER_DIR" && npm start) &
  SERVER_PID=$!

  info "Waiting for backend to be ready..."
  ATTEMPTS=0
  MAX_ATTEMPTS=30
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 0.5
    ATTEMPTS=$((ATTEMPTS + 1))
    if port_responds "$BACKEND_PORT"; then
      success "Backend is ready on http://localhost:$BACKEND_PORT"
      break
    fi
    if [ $((ATTEMPTS % 10)) -eq 0 ]; then
      info "Still waiting... ($ATTEMPTS/$MAX_ATTEMPTS attempts)"
    fi
  done

  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    error "Backend failed to start after $MAX_ATTEMPTS attempts. Check the output above for the actual error."
    exit 1
  fi
fi

info ""

###############################################################################
# START FRONTEND
###############################################################################

if port_responds "$FRONTEND_PORT"; then
  warning "Something is already responding on port $FRONTEND_PORT - assuming frontend is already running, skipping start."
else
  info "Starting frontend (Vite + React, port $FRONTEND_PORT)..."
  (cd "$CLIENT_DIR" && npm run dev) &
  CLIENT_PID=$!

  info "Waiting for frontend to be ready..."
  ATTEMPTS=0
  MAX_ATTEMPTS=30
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    sleep 0.5
    ATTEMPTS=$((ATTEMPTS + 1))
    if port_responds "$FRONTEND_PORT"; then
      success "Frontend is ready on http://localhost:$FRONTEND_PORT"
      break
    fi
    if [ $((ATTEMPTS % 10)) -eq 0 ]; then
      info "Still waiting... ($ATTEMPTS/$MAX_ATTEMPTS attempts)"
    fi
  done

  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    error "Frontend failed to start after $MAX_ATTEMPTS attempts."
    error "If vite.config.js doesn't pin server.port, Vite may have picked a different port - check the output above."
    exit 1
  fi
fi

info ""

###############################################################################
# START ANALYSIS SERVICE (optional - only if analysis/ exists)
###############################################################################

if [ -d "$ANALYSIS_DIR" ] && [ -n "$PYTHON_BIN" ]; then
  if port_responds "$ANALYSIS_PORT"; then
    warning "Something is already responding on port $ANALYSIS_PORT - assuming analysis service is already running, skipping start."
  else
    info "Starting analysis service (Python/Flask, port $ANALYSIS_PORT)..."
    (cd "$ANALYSIS_DIR" && ./venv/bin/python app.py) &
    ANALYSIS_PID=$!

    info "Waiting for analysis service to be ready..."
    ATTEMPTS=0
    MAX_ATTEMPTS=30
    while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
      sleep 0.5
      ATTEMPTS=$((ATTEMPTS + 1))
      if port_responds "$ANALYSIS_PORT"; then
        success "Analysis service is ready on http://localhost:$ANALYSIS_PORT"
        break
      fi
      if [ $((ATTEMPTS % 10)) -eq 0 ]; then
        info "Still waiting... ($ATTEMPTS/$MAX_ATTEMPTS attempts)"
      fi
    done

    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
      error "Analysis service failed to start after $MAX_ATTEMPTS attempts. Check the output above for the actual error."
      exit 1
    fi
  fi
  info ""
fi

###############################################################################
# OPEN BROWSER (OPTIONAL)
###############################################################################

NO_BROWSER=false
for arg in "$@"; do
  if [ "$arg" = "--no-browser" ]; then
    NO_BROWSER=true
    break
  fi
done

if [ "$NO_BROWSER" = false ]; then
  info "Opening browser at http://localhost:$FRONTEND_PORT..."
  case "$(uname -s)" in
    Darwin) open "http://localhost:$FRONTEND_PORT" 2>/dev/null || warning "Could not open browser automatically" ;;
    Linux)  xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || warning "Could not open browser automatically" ;;
    *)      warning "Unsupported OS for browser auto-open - open http://localhost:$FRONTEND_PORT manually" ;;
  esac
fi

info ""
success "All services running. Press Ctrl+C to stop (this also cleans up every process)."
info "Backend:  http://localhost:$BACKEND_PORT"
info "Frontend: http://localhost:$FRONTEND_PORT"
if [ -n "$ANALYSIS_PID" ]; then
  info "Analysis: http://localhost:$ANALYSIS_PORT"
fi
info ""

###############################################################################
# KEEP RUNNING
###############################################################################

wait
