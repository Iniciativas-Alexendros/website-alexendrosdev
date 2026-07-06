#!/bin/bash
# restore-minipc-key.sh
# Restaura el acceso SSH a la MiniPC desde la private key encriptada guardada
# en Proton Pass.
#
# Escenario: perdiste ~/.ssh/minipc_recovery y necesitas recuperarlo.
# Pre-requisito: tener pass-cli autenticado y conocer el nombre del item.
#
# Uso:
#   ./scripts/recovery/restore-minipc-key.sh
#   ./scripts/recovery/restore-minipc-key.sh --name "Otro nombre"
#
# El script:
#   1. Recupera el item 'MiniPC Recovery SSH Key' de Proton Pass
#   2. Decodifica el base64 → recupera el .gpg encriptado
#   3. Pide el passphrase (campo del item)
#   4. Desencripta con gpg → recupera la private key
#   5. La guarda en ~/.ssh/minipc_recovery con permisos 600
#   6. Verifica que la key funciona conectándose a la MiniPC

set -euo pipefail

ITEM_NAME="${1:-MiniPC Recovery SSH Key}"
KEY_PATH="${KEY_PATH:-$HOME/.ssh/minipc_recovery}"

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

bold "═══════════════════════════════════════════════════════"
bold "  MiniPC Recovery Key Restore"
bold "═══════════════════════════════════════════════════════"
echo

# 1. Verificar pass-cli
if ! command -v pass >/dev/null 2>&1; then
  red "✗ pass-cli no instalado. Instalar: https://github.com/protonpass/pass-cli"
  exit 1
fi

# 2. Verificar que el item existe
ITEM_ID=$(pass item list Infraestructura 2>/dev/null | grep -F "$ITEM_NAME" | head -1 | awk -F': ' '{print $1}' | tr -d '[]-' | tr -d ' ')
if [ -z "$ITEM_ID" ]; then
  red "✗ Item '$ITEM_NAME' no encontrado en vault Infraestructura"
  exit 1
fi

# 3. Recuperar campos
FULL_REF="pass://ZCkD7Qi6wqRv63zvPUOinesE3qK2aEne3y4_U7Od_15Zo6q208h6Ofqb49qSVsFXhxKdWuAGHBdVKpNGS_YGMw==/$ITEM_ID"

yellow "▸ Recuperando campos del item desde Proton Pass..."
ENCRYPTED_B64=$(pass item view "$FULL_REF" 2>/dev/null | awk '/encrypted_private_key/{print $2}')
PASSPHRASE=$(pass item view "$FULL_REF" 2>/dev/null | awk '/^passphrase/{print $2}')

if [ -z "$ENCRYPTED_B64" ] || [ -z "$PASSPHRASE" ]; then
  red "✗ No se pudieron extraer los campos (encrypted_private_key, passphrase)"
  exit 1
fi
green "  ✓ Campos extraídos"

# 4. Decodificar base64 → .gpg
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT
echo "$ENCRYPTED_B64" | base64 -d > "$TMPDIR/key.gpg"

# 5. Desencriptar
yellow "▸ Desencriptando con GPG..."
if ! echo "$PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
  --decrypt "$TMPDIR/key.gpg" > "$TMPDIR/key" 2>/dev/null; then
  red "✗ Error al desencriptar (passphrase incorrecta?)"
  exit 1
fi
chmod 600 "$TMPDIR/key"
green "  ✓ Key desencriptada"

# 6. Mover a destino
if [ -e "$KEY_PATH" ]; then
  yellow "  ⚠ $KEY_PATH ya existe. Backup a ${KEY_PATH}.bak.$(date +%s)"
  mv "$KEY_PATH" "${KEY_PATH}.bak.$(date +%s)"
fi
mv "$TMPDIR/key" "$KEY_PATH"
chmod 600 "$KEY_PATH"
green "  ✓ Key restaurada en $KEY_PATH"

# 7. Test conexión
bold ""
bold "▸ Test de conexión a la MiniPC..."
if timeout 10 ssh -i "$KEY_PATH" \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -o ConnectTimeout=5 -o BatchMode=yes \
  -p 22 root@192.168.1.129 'hostname && date -u' 2>/dev/null; then
  green "  ✅ Conexión exitosa a MiniPC"
else
  red "  ❌ Conexión falló. Verifica authorized_keys en la MiniPC"
  exit 1
fi

echo
green "═══════════════════════════════════════════════════════"
green "  ✅ Recovery completado. Acceso restaurado."
green "═══════════════════════════════════════════════════════"
