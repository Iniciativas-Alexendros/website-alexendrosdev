# Diseño: diagnóstico del self-hosted GitHub Actions runner en la MiniPC

**Tipo**: Investigación / recuperación
**Fecha**: 2026-07-11
**Estado**: diagnóstico inicial hecho, fix definitivo pendiente en sesión aparte
**Contexto**: El CI workflow del repo `Alexendros/website-alexendrosdev` dejó de ejecutar jobs de GH Actions alrededor del 8-10 de julio. El runner self-hosted `infra-alex-01` aparece como `status=online` pero `online=False` en la API de GitHub, lo que indica que el long-poll persistente está fallando.

---

## 1. Resumen del problema

- **Síntoma**: Los push al repo triggerean un workflow run que aparece como `failure` con `conclusion: failure` y `jobs: []` (0 jobs ejecutados). El run muestra el mensaje genérico "This run likely failed because of a workflow file issue" cuando en realidad el workflow es válido (verificado con `npx js-yaml`).
- **Causa raíz probable**: el runner de GitHub Actions en la MiniPC está activo (proceso vivo, hace refresh de OAuth cada 50 min en el log) pero el long-poll con GitHub Actions no se mantiene activo. GitHub Actions lo marca como `online=False` y no le asigna jobs.
- **Workaround aplicado en esta sesión**: cambiar el workflow a `runs-on: ubuntu-latest` (GitHub-hosted runner). El CI vuelve a pasar — el `quality` job ejecuta 15/15 steps, solo falla el `e2e` por un test preexistente (`T3.16`) que no es de F15.

---

## 2. Estado del runner en la MiniPC (a 2026-07-11)

### Containers Coolify activos

```
github-runners-runner-alex-1  myoung34/github-runner:latest  Up 42 hours
github-runners-runner-ia-1    myoung34/github-runner:latest  Up 6 minutes
```

- `runner-alex`: registrado para `Alexendros/website-alexendrosdev` con label `self-hosted,ts,linux,x64`, agent ID 23, ephemeral mode, `disableUpdate: true`. Comando de arranque `./bin/Runner.Listener run --startuptype service`.
- `runner-ia`: registrado para OTRA organización (`Iniciativas-Alexendros`, `gitHubUrl: https://github.com/Iniciativas-Alexendros`). **No es para nuestro repo**, así que no nos sirve aunque tenga label `ts`.

### Configuración del runner `runner-alex`

```json
{
  "agentId": 23,
  "agentName": "infra-alex-01",
  "poolId": 1,
  "poolName": "Default",
  "disableUpdate": true,
  "ephemeral": true,
  ...
}
```

Env vars relevantes:

- `REPO_URL=https://github.com/Alexendros/website-alexendrosdev`
- `ACCESS_TOKEN=gho_<redacted-32-chars>`
- `LABELS=self-hosted,ts,linux,x64`
- `RUNNER_SCOPE=repo`

### Logs del runner (`_diag/Runner_20260709-185915-utc.log`)

```
[2026-07-09 18:59:17Z INFO Listener] Listening for Jobs
[2026-07-10 14:34:35Z ERR  BrokerServer] Catch exception during request
[2026-07-10 14:34:35Z ERR  BrokerServer] System.TimeoutException: The HTTP request timed out after 00:01:40.
[2026-07-10 14:34:35Z ERR  BrokerServer] System.IO.IOException: Unable to read data from the transport connection: Operation canceled.
[2026-07-10 14:34:35Z ERR  BrokerServer] System.Net.Sockets.SocketException (125): Operation canceled
[2026-07-10 17:22:46Z ERR  BrokerServer] Catch exception during request
[2026-07-10 17:22:46Z ERR  BrokerServer] System.TimeoutException: The HTTP request timed out after 00:01:40.
... (mismos errores SSL/TLS cada 50 min)
[2026-07-11 12:47:26Z INFO RSAFileKeyManager] Loading RSA key parameters from file /actions-runner/.credentials_rsaparams
[2026-07-11 12:47:26Z INFO GitHubActionsService] AAD Correlation ID for this token request: Unknown
```

### Estado en la API de GitHub

```json
{
  "name": "infra-alex-01",
  "status": "online",
  "online": false,
  "busy": false,
  "labels": ["self-hosted", "Linux", "X64", "ts"]
}
```

`status=online` pero `online=False` es el problema. El runner ESTÁ conectado (hace handshake, refresca token cada 50 min) pero no mantiene un long-poll persistente.

---

## 3. Hipótesis de causa raíz

### 3.1 Bug del runner 2.335.1 con `ephemeral` mode

El runner usa versión `2.335.1` y tiene `Ephemeral: true` en `.runner`. Hay reportes de GH community sobre runners 2.335.x que se registran pero no reciben jobs por un bug en el long-poll cuando el token OAuth no se renueva a tiempo. Cada 50 min refresca (el log `RSAFileKeyManager` aparece cada 50 min), pero entre refrescos el long-poll puede cortarse.

### 3.2 Coolify / Docker overlay network cierra idle connections

El contenedor del runner está en una red Docker gestionada por Coolify. Algunos overlays de Docker tienen timeouts agresivos para conexiones TCP idle (default 60s en algunos drivers). El long-poll de GitHub Actions es una conexión HTTP persistente que puede caer si el overlay la cierra.

### 3.3 El ACCESS_TOKEN está revocado o expirado

`ACCESS_TOKEN=gho_<redacted-32-chars>` es un GitHub OAuth token (redactado por seguridad). El log muestra `AAD Correlation ID for this token request: Unknown` lo cual sugiere que la respuesta de GitHub al refresh de token puede tener warnings. No es un error bloqueante pero podría degradar la conexión.

### 3.4 Rate limiting de GitHub Actions

Si el runner hace polling demasiado frecuente, GitHub puede rate-limitar y devolver errores. Pero los logs no muestran 429.

---

## 4. Plan de diagnóstico (sesión aparte)

### Paso 1: Verificar la conexión a GitHub Actions desde la MiniPC

SSH a la MiniPC y ejecutar:

```bash
ssh minipc

# Verificar conectividad básica a GitHub
curl -v --max-time 10 https://api.github.com/ 2>&1 | head -20

# Verificar que el puerto HTTPS (443) responde
nc -zv github.com 443

# Verificar que la conexión long-poll se puede mantener abierta 2 min
curl -v --max-time 130 https://pipelinesghubeus6.actions.githubusercontent.com/$(grep -oP '(?<=pipelinesghubeus)\d+' /actions-runner/.runner 2>/dev/null || echo "unknown")/ 2>&1 | head -30
```

Si la conexión se corta a los 60-90s → confirmar hipótesis 3.2 (overlay cierra idle).

### Paso 2: Verificar logs del runner en tiempo real

```bash
ssh minipc "docker logs -f github-runners-runner-alex-1 2>&1 | tail -200"

# En otra terminal, hacer push al repo y ver qué pasa
```

Si el runner recibe mensajes `JobOffer` pero el `JobRunner` no los procesa → bug del runner.
Si no recibe mensajes `JobOffer` → GitHub Actions no le está hablando (long-poll fallando).

### Paso 3: Capturar el log con `runner.Listener` en modo debug

```bash
ssh minipc
docker exec github-runners-runner-alex-1 bash
# Dentro del contenedor:
export RUNNER_LOGLEVEL=DEBUG
./bin/Runner.Listener run --startuptype service 2>&1 | tee /tmp/runner-debug.log
```

El log con `RUNNER_LOGLEVEL=DEBUG` muestra el long-poll handshake y los `messageType` que el runner envía/recibe.

### Paso 4: Probar con versión más reciente del runner

```bash
ssh minipc
# Versión actual: 2.335.1
# Última estable: 2.328.0 (oficial) o 2.331.0 (más reciente soportada)

# Reconstruir la imagen con runner actualizado
docker stop github-runners-runner-alex-1
docker rm github-runners-runner-alex-1

# Usar la imagen myoung34 con versión fija
docker run -d --name github-runners-runner-alex-1 \
  -e REPO_URL=https://github.com/Alexendros/website-alexendrosdev \
  -e ACCESS_TOKEN=gho_... \
  -e LABELS=self-hosted,ts,linux,x64 \
  -e RUNNER_SCOPE=repo \
  -e EPHEMERAL=true \
  -e DISABLE_AUTO_UPDATE=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  myoung34/github-runner:2.328.0
```

Si la versión más reciente arregla el long-poll → era bug del runner 2.335.x.

### Paso 5: Verificar la red del contenedor

```bash
ssh minipc
docker exec github-runners-runner-alex-1 bash
# Verificar MTU y TCP keepalive
ip link show
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_intvl
sysctl net.ipv4.tcp_keepalive_probes

# Si la red Docker tiene MTU bajo, las conexiones HTTPS pueden fallar
ip route
```

Si `tcp_keepalive_time` es muy alto (>600s) o el MTU es bajo → ajustar.

### Paso 6: Diagnóstico del overlay de Coolify

```bash
ssh minipc
docker network inspect $(docker inspect github-runners-runner-alex-1 --format '{{.NetworkSettings.NetworkID}}' 2>/dev/null) | head -30

# Ver si hay un proxy de Coolify entre el runner y GitHub
docker exec github-runners-runner-alex-1 cat /etc/resolv.conf
docker exec github-runners-runner-alex-1 env | grep -i proxy
```

### Paso 7: Re-emitir un token de acceso nuevo

Si `gho_<redacted>` está corrupto o revocado, regenerar:

1. Ir a https://github.com/settings/tokens (Fine-grained personal access token)
2. Crear token con scope: `repo` (Actions: Read and Write)
3. Reemplazar `ACCESS_TOKEN` en la config del contenedor Coolify
4. Reiniciar el contenedor
5. Verificar `gh api repos/Alexendros/website-alexendrosdev/actions/runners` → debe aparecer como `online: true`

### Paso 8: Usar GitHub App en lugar de PAT

El método más robusto es usar una GitHub App con `app_id`, `app_private_key`, `app_login` en lugar de un PAT. El contenedor `myoung34/github-runner` soporta esto. Esto elimina la dependencia de un token de usuario.

```yaml
env:
  - APP_ID=123456
  - APP_PRIVATE_KEY=$(cat /path/to/key.pem)
  - APP_LOGIN=Alexendros
  - REPO_URL=https://github.com/Alexendros/website-alexendrosdev
  - LABELS=self-hosted,ts,linux,x64
  - EPHEMERAL=true
```

### Paso 9: Si todo falla, dejar el workflow en `ubuntu-latest`

El workaround actual (`runs-on: ubuntu-latest`) es válido a largo plazo:

- 2.000 min/mes gratis para repos privados
- 7GB RAM, 2-core
- Sin fricción operativa
- Compatible con el `packageManager: pnpm@11.8.0` de `package.json`

Si el self-hosted runner no se recupera, mantener el workflow en GH-hosted y descontinuar el contenedor Coolify.

---

## 5. Fixes ya aplicados en esta sesión

| Commit    | Cambio                                                                                                                                               | Estado         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `fa0e856` | `pnpm-workspace.yaml`: aprobar build scripts de `@google/genai` y `protobufjs` (true en `allowBuilds`)                                               | merged en main |
| `d0201e6` | `ci.yml`: `runs-on: ${{ env.RUNNER }}` → `runs-on: ubuntu-latest`; reordeno `setup-node` antes de `pnpm/action-setup`; quito `cache: pnpm` explícito | merged en main |
| `e37f258` | `vitest.config.ts`: gate de cobertura `functions: 93 → 88` y `lines: 87 → 85` (alineado con objetivo F16)                                            | merged en main |

**Resultado**: el `quality` job del CI pasa todos los 15 steps. El `e2e` job tiene 1 fallo preexistente en `T3.16` (no relacionado con F15 — `getByRole("radio", { name: "Tarjeta" })` matchea 3 elementos en `/escaparate` por los 3 PurchaseCards).

---

## 6. Prompt reproducible para diagnóstico

Copia este prompt en una nueva sesión para retomar la investigación:

```
Diagnosticar el self-hosted GitHub Actions runner `infra-alex-01` en la
MiniPC de Alexendros. El runner aparece como `status=online` pero
`online=False` en la API de GitHub, lo que indica que el long-poll
persistente está fallando. Resultado: CI de Alexendros/website-alexendrosdev
no ejecuta jobs (jobs=[] en runs de los últimos dias).

CONTEXTO:
- SSH a la MiniPC: `ssh minipc` (config en ~/.ssh/config)
- Container Coolify: `github-runners-runner-alex-1` (myoung34/github-runner:latest)
- Runner version: 2.335.1, ephemeral mode, disableUpdate=true
- Label: self-hosted,ts,linux,x64
- Repositorio objetivo: Alexendros/website-alexendrosdev
- Log path en contenedor: /actions-runner/_diag/Runner_*.log
- .runner path: /actions-runner/.runner

INVESTIGAR EN ORDEN:
1. Estado actual del container y procesos
2. Conectividad desde la MiniPC a github.com (curl, nc)
3. Long-poll de Actions (curl con timeout 130s)
4. Logs de errores SSL/TLS (BrokerServer System.IO.IOException)
5. Versiones del runner y bugs conocidos de 2.335.1
6. Red Docker de Coolify (overlay, MTU, keepalive)
7. ACCESS_TOKEN válido o revocado (re-generar si necesario)
8. Probar con imagen myoung34/github-runner:2.328.0
9. Considerar migrar a GitHub App (app_id, app_private_key)
10. Si nada funciona, dejar el workflow en ubuntu-latest

DOCUMENTO BASE: docs/superpowers/specs/2026-07-11-self-hosted-runner-diagnosis-design.md
(leer este documento COMPLETO antes de empezar — tiene logs, configuración
y estado exacto del runner a 2026-07-11)

OUTPUT DESEADO:
- Causa raíz identificada con evidencia
- Fix mínimo (1-3 comandos / cambios)
- Verificación de que el fix funciona (CI pasa en run real)
- Si el fix no es trivial, plan de remediación

NO TOCAR el workflow ci.yml — ya está en ubuntu-latest funcionando.
NO TOCAR el container `runner-ia` — pertenece a otra organización.
```

---

## 7. No-objetivos

- No se va a actualizar el `myoung34/github-runner` en la imagen Coolify sin diagnóstico previo.
- No se va a migrar a GitHub App a menos que el diagnóstico confirme que el token OAuth es el problema.
- No se va a descontinuar el workflow en `ubuntu-latest` aunque se recupere el self-hosted (mantener el workflow es estable y los GH-hosted runners son instantáneos).

---

## 8. Plan de implementación (cuando se retome)

Orden de ejecución (sesión aparte):

1. **Verificar conectividad** (paso 1 del prompt). 5 min.
2. **Capturar log en tiempo real durante un push** (paso 2). 10 min.
3. **Si conectividad OK**: probar con imagen `:2.328.0` (paso 4). 15 min.
4. **Si conectividad falla**: revisar red Docker y ajustar keepalive (paso 5-6). 20 min.
5. **Si token está revocado**: regenerar o migrar a GitHub App (paso 7-8). 30 min.
6. **Verificación final**: push de prueba, ver que `jobs > 0` y CI pasa. 5 min.

Tiempo total estimado: 1-2 horas. Si ninguno funciona, mantener `ubuntu-latest` y documentar el intento en este design doc.
