#!/usr/bin/env bash
set -euo pipefail

# validate-tokens.sh — Validates design-tokens.css ↔ tokens.json consistency.
#
# Usage:  bash scripts/validate-tokens.sh [--json]
# Exit:   0 = clean, 1 = warnings, 2 = errors

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ ! -f "$PROJECT_ROOT/src/styles/design-tokens.css" ]]; then
  echo "❌ design-tokens.css not found"
  exit 2
fi
if [[ ! -f "$PROJECT_ROOT/src/tokens/tokens.json" ]]; then
  echo "❌ tokens.json not found"
  exit 2
fi
if ! command -v node &>/dev/null; then
  echo "❌ node required"
  exit 2
fi

node "$SCRIPT_DIR/validate-tokens.mjs"
EXIT_CODE=$?

echo ""
case $EXIT_CODE in
  0) echo "✅ All tokens validated successfully." ;;
  1) echo "⚠️  Tokens validated with warnings." ;;
  *) echo "❌ Token validation failed." ;;
esac
exit $EXIT_CODE
