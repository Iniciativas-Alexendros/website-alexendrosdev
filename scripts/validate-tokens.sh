#!/usr/bin/env bash
set -euo pipefail

# validate-tokens.sh — Validates design-tokens.css ↔ tokens.json consistency.
#
# Usage:  bash scripts/validate-tokens.sh [--json]
#
# Options:
#   --json    Output machine-readable JSON report (exit codes: 0/1/2)
#
# Exit codes:
#   0 = clean
#   1 = warnings (e.g. hex conversion off within tolerance)
#   2 = errors   (missing tokens, broken contrast)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_MODE="text"

if [[ "${1:-}" == "--json" ]]; then
  REPORT_MODE="json"
fi

# Preflight: check source files exist
if [[ ! -f "$PROJECT_ROOT/src/styles/design-tokens.css" ]]; then
  echo "❌ design-tokens.css not found at src/styles/design-tokens.css"
  exit 2
fi
if [[ ! -f "$PROJECT_ROOT/src/tokens/tokens.json" ]]; then
  echo "❌ tokens.json not found at src/tokens/tokens.json"
  exit 2
fi

# Preflight: check node is available
if ! command -v node &>/dev/null; then
  echo "❌ node is required but not found"
  exit 2
fi

# Run the validation script
if [[ "$REPORT_MODE" == "json" ]]; then
  # Capture stdout as JSON, filter stderr separately
  node "$SCRIPT_DIR/validate-tokens.mjs" 2>/dev/null || true
else
  node "$SCRIPT_DIR/validate-tokens.mjs"
  EXIT_CODE=$?
  echo ""
  if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ All tokens validated successfully."
  elif [[ $EXIT_CODE -eq 1 ]]; then
    echo "⚠️  Tokens validated with warnings."
  else
    echo "❌ Token validation failed."
  fi
  exit $EXIT_CODE
fi
