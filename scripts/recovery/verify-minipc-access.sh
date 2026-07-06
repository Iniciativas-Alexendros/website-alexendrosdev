#!/bin/bash
# verify-minipc-access.sh
# Verifica todas las vías de acceso SSH a la MiniPC.
# Útil como test de disaster recovery.
#
# Ejecutar: ./scripts/recovery/verify-minipc-access.sh
#
# Salidas esperadas:
#   - LAN directa (192.168.1.129) con la recovery key
#   - Tunnel Cloudflare (ssh.alexendros.cloud) con la recovery key
#   - Tunnel con la key principal (de Coolify)
#
# Si todas funcionan, el acceso es redundante. Si alguna falla, sabes cuál
# vía alternativa sigue viva.

set -e

RECOVERY_KEY="${RECOVERY_KEY:-$HOME/.ssh/minipc_recovery}"
PRIMARY_KEY="${PRIMARY_KEY:-/tmp/devin-ssh/coolify.key}"
HOST_LAN="192.168.1.129"
HOST_TUNNEL="ssh.alexendros.cloud"

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

check_ssh() {
  local label="$1"
  local key="$2"
  local host="$3"
  local port="${4:-22}"

  if [ ! -f "$key" ]; then
    yellow "  ⏭  $label: key no encontrada ($key) — omitiendo"
    return 1
  fi

  if timeout 8 ssh -i "$key" \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=5 -o BatchMode=yes \
    -p "$port" "root@$host" 'echo "OK|$(hostname)|$(date -u +%FT%TZ)"' 2>/dev/null; then
    green "  ✅ $label"
    return 0
  else
    red "  ❌ $label"
    return 1
  fi
}

bold "═══════════════════════════════════════════════════════"
bold "  MiniPC Access Verification — $(date -u +%FT%TZ)"
bold "═══════════════════════════════════════════════════════"
echo

bold "▸ Vía 1: LAN directa (recovery key)"
check_ssh "192.168.1.129:22 con minipc_recovery" "$RECOVERY_KEY" "$HOST_LAN" 22 || true
echo

bold "▸ Vía 2: Tunnel Cloudflare (recovery key)"
check_ssh "ssh.alexendros.cloud con minipc_recovery" "$RECOVERY_KEY" "$HOST_TUNNEL" 22 || true
echo

bold "▸ Vía 3: Tunnel Cloudflare (key principal / Coolify)"
if [ -f "$PRIMARY_KEY" ]; then
  check_ssh "ssh.alexendros.cloud con coolify key" "$PRIMARY_KEY" "$HOST_TUNNEL" 22 || true
else
  yellow "  ⏭  coolify.key no presente en $PRIMARY_KEY — omitiendo"
fi
echo

bold "▸ Vía 4: Servicios accesibles (no SSH)"
# Coolify UI via tunnel
if timeout 5 bash -c "echo > /dev/tcp/coolify.alexendros.cloud/443" 2>/dev/null; then
  green "  ✅ coolify.alexendros.cloud:443 (Coolify UI)"
else
  red "  ❌ coolify.alexendros.cloud:443"
fi
# Supabase REST
if timeout 5 bash -c "echo > /dev/tcp/supabase.alexendros.cloud/443" 2>/dev/null; then
  green "  ✅ supabase.alexendros.cloud:443 (Supabase REST)"
else
  red "  ❌ supabase.alexendros.cloud:443"
fi
echo

bold "▸ Resumen de credenciales de recovery"
echo "  • SSH recovery key:   $RECOVERY_KEY"
echo "  • SSH pubkey fingerprint:"
ssh-keygen -lf "$RECOVERY_KEY.pub" 2>/dev/null | sed 's/^/      /'
echo "  • Proton Pass item:   'MiniPC Recovery SSH Key' (vault: Infraestructura)"
echo "  • Xpipe connection:   'minipc-lan' y 'minipc-tunnel' (categoría: server.miniPC)"
echo
bold "═══════════════════════════════════════════════════════"
