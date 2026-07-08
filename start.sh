#!/bin/bash
# Repo-level starter: delegates to client/start.sh which orchestrates services.
set -e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$PROJECT_DIR/client/start.sh" "$@"
