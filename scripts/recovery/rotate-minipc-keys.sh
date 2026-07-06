#!/bin/bash
# rotate-minipc-keys.sh
# Rota todas las SSH keys authorized en la MiniPC de forma segura.
#
# Flujo:
#   1. Genera una nueva keypair con comentario rot-<fecha>
#   2. Sube la pubkey a /root/.ssh/authorized_keys (append)
#   3. Verifica que la nueva key conecta
#   4. (Opcional, --remove-old) Elimina las keys anteriores
#   5. (Opcional, --update-pass) Sube la nueva key a Proton Pass
#
# Uso:
#   ./scripts/recovery/rotate-minipc-keys.sh
#   ./scripts/recovery/rotate-minipc-keys.sh --remove-old
#   ./scripts/recovery/rotate-minipc-keys.sh --update-pass

set -euo pipefail

RECOVERY_KEY="${RECOVERY_KEY:-$HOME/.ssh/minipc_recovery}"
SSH_OPTS=(-i "$RECOVERY_KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null
          -o ConnectTimeout=5 -o BatchMode=yes -p 22 root@192.168.1.129)
DATE=$(date +%Y%m%d-%H%M%S)
NEWKEY="$HOME/.ssh/minipc_rotate_$DATE"
NEWKEY_PUB="${NEWKEY}.pub"

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

bold "═══════════════════════════════════════════════════════"
bold "  MiniPC SSH Key Rotation — $DATE"
bold "═══════════════════════════════════════════════════════"
echo

# Pre-check
if [ ! -f "$RECOVERY_KEY" ]; then
  red "✗ Recovery key no encontrada. Ejecuta restore-minipc-key.sh primero."
  exit 1
fi

yellow "▸ Verificando acceso actual a la MiniPC..."
if ! ssh "${SSH_OPTS[@]}" 'hostname' >/dev/null 2>&1; then
  red "✗ No se puede conectar. Verifica tu red / tunnel."
  exit 1
fi
green "  ✓ Conexión OK"

# 1. Generar nueva keypair
bold ""
bold "▸ Generando nueva keypair ($NEWKEY)..."
ssh-keygen -t ed25519 -a 100 -C "alexendros@proton.me :: minipc-rotation :: $DATE" \
  -f "$NEWKEY" -N "" >/dev/null
chmod 600 "$NEWKEY" "$NEWKEY_PUB"
green "  ✓ Keypair generada"
echo "  Fingerprint: $(ssh-keygen -lf "$NEWKEY_PUB" | awk '{print $2}')"

# 2. Subir pubkey
bold ""
bold "▸ Subiendo pubkey a la MiniPC..."
PUBKEY_CONTENT=$(cat "$NEWKEY_PUB")
ssh "${SSH_OPTS[@]}" "echo '$PUBKEY_CONTENT' >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo OK" >/dev/null
green "  ✓ Pubkey añadida"

# 3. Verificar
bold ""
bold "▸ Verificando que la nueva key conecta..."
if timeout 8 ssh -i "$NEWKEY" \
  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  -o ConnectTimeout=5 -o BatchMode=yes \
  -p 22 root@192.168.1.129 'hostname' >/dev/null 2>&1; then
  green "  ✅ Nueva key funciona"
else
  red "  ✗ La nueva key NO funciona. Algo salió mal."
  exit 1
fi

# 4. (Opcional) Eliminar keys antiguas
if [ "${1:-}" = "--remove-old" ]; then
  bold ""
  bold "▸ Eliminando keys antiguas (manteniendo solo minipc_recovery + nueva)..."
  ssh "${SSH_OPTS[@]}" 'grep -v "minipc_recovery\|minipc_rotate_'"$DATE"'" /root/.ssh/authorized_keys > /tmp/ak.tmp && mv /tmp/ak.tmp /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && wc -l /root/.ssh/authorized_keys'
  green "  ✓ Keys antiguas removidas"
fi

# 5. (Opcional) Subir a Proton Pass
if [ "${1:-}" = "--update-pass" ] || [ "${2:-}" = "--update-pass" ]; then
  bold ""
  bold "▸ Actualizando Proton Pass con la nueva key..."
  echo "  (Pendiente: usar pass item update)"
  # TODO: usar `pass item update` con campos nuevos
fi

# Resumen
bold ""
bold "═══════════════════════════════════════════════════════"
bold "  ✅ Rotación completada"
bold "═══════════════════════════════════════════════════════"
echo
echo "  Nueva key privada: $NEWKEY"
echo "  Nueva pubkey:      $NEWKEY_PUB"
echo "  Authorized en MiniPC con comentario: minipc-rotation :: $DATE"
echo
echo "  PRÓXIMOS PASOS:"
echo "  1. Subir la nueva private key a Proton Pass:"
echo "     scripts/recovery/rotate-minipc-keys.sh --update-pass"
echo "  2. Eliminar la key antigua del item en Proton Pass"
echo "  3. Eliminar archivos locales antiguos: rm $NEWKEY"
echo
