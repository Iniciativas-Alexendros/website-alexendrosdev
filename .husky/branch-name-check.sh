#!/usr/bin/env sh
# Branch naming validator — bloquea push si la rama no sigue convención.
# Se ejecuta como parte del pre-push hook.

BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Ramas protegidas: siempre OK
case "$BRANCH" in
  main|develop|HEAD) exit 0 ;;
esac

# Dependabot branches: siempre OK
case "$BRANCH" in
  dependabot/*) exit 0 ;;
esac

# Convenciones permitidas
VALID_PREFIXES="feat|fix|chore|ci|docs|refactor|test|perf|revert|hotfix"

if echo "$BRANCH" | grep -qE "^($VALID_PREFIXES)/"; then
  exit 0
fi

echo ""
echo "🚫 Rama '$BRANCH' no sigue la convención de nombres."
echo "   Prefijos válidos: $VALID_PREFIXES"
echo "   Ejemplo: feat/nueva-feature, fix/bug-urgente, chore/update-deps"
echo ""
exit 1
