# Diseño F15: Agentes IA Autónomos + Hardening

**Feature**: F15 — Agentes IA integrados en website-alexendrosdev
**Estado**: diseño aprobado
**Fecha**: 2026-07-09
**Enfoque**: vertical slices (un agente completo a la vez)
**Dependencias satisfechas**: F11 (catálogo), F14 (CRM API + webhook), F14b (Notion sync)

---

## 1. Objetivo

Integrar agentes IA autónomos directamente en el proyecto Next.js existente. Los agentes
monitorean el pipeline comercial, diagnostican incidencias y ejecutan reparaciones — todo
desde el mismo proceso, sin repositorio externo ni infraestructura adicional.

**Cambio de diseño respecto a ROADMAP original:**

- ~~Repo Python/FastAPI separado~~ → módulos TypeScript integrados en `src/lib/agents/`
- ~~Cadena de fallback Ollama→cloud~~ → un solo proveedor LLM con fallback entre modelos free
- Comunicación con CRM: vía endpoints internos (`/api/crm/*`) para mantener desacoplamiento y testear el contrato real
- ~~Ollama local~~ → Gemini 3.5 Flash (primario) + OpenCode Zen free models (fallback secundario). Sin Ollama, sin Anthropic, sin proveedores de pago.

## 2. Estructura de archivos

```
src/lib/agents/
├── index.ts              # Exportaciones principales
├── config.ts             # Settings desde env vars
├── llm-provider.ts       # Provider LLM híbrido: Gemini (primario) + OpenCode Zen (fallbacks)
├── prompts.ts            # System prompts + few-shot examples por agente
├── schemas.ts            # JSON schemas para respuestas estructuradas
├── crm-client.ts         # Cliente interno CRM (fetch a /api/crm/*)
├── auditor.ts            # Agente Auditor
├── diagnosticador.ts     # Agente Diagnosticador
├── reparador.ts          # Agente Reparador
└── eval/
    ├── utilidad.ts       # F15b: evaluación calidad diagnóstica
    └── cumplimiento.ts   # F15b: evaluación contrato CRM

src/app/api/agents/
├── health/route.ts       # GET /api/agents/health
├── hooks/route.ts        # POST /api/agents/hooks (webhook Stripe → auditor)
├── audit/route.ts        # POST /api/agents/audit (trigger manual auditor)
├── diagnose/route.ts     # POST /api/agents/diagnose
└── repair/route.ts       # POST /api/agents/repair
```

## 3. Capa LLM — Provider híbrido (Gemini + OpenCode Zen)

### 3.1 Proveedor híbrido

Sin Ollama, sin Anthropic, sin proveedores de pago. Cadena de 2 providers con 4
modelos en total: Gemini 3.5 Flash como primario (vía Google GenAI SDK), luego 3
modelos free de OpenCode Zen como fallbacks (vía API OpenAI-compatible). El cliente
orquesta ambos y degrada a heurísticas deterministas si toda la cascada falla.

**Modelos (orden de prioridad):**

1. **`gemini-3.5-flash`** (Google Gemini API, gratuita, 1M contexto, thinking budgets) — primario
2. `deepseek-v4-flash-free` (OpenCode Zen) — fallback 1
3. `mimo-v2.5-free` (OpenCode Zen) — fallback 2
4. `north-mini-code-free` (OpenCode Zen, solo Reparador por contexto 32K) — fallback 3

**Decisión**: Gemini 3.5 Flash es el más capaz en razonamiento (thinking budgets,
1M tokens de contexto), es estable (no en feedback period) y es gratuito. Los 3
modelos free de OpenCode Zen actúan como fallback ante rate limits o indisponibilidad
de Gemini. El cliente `llm.ts` orquesta 2 clientes (uno por provider) e itera la
cascada completa hasta obtener respuesta o degradar a heurísticas deterministas.

**Interfaz:**

```typescript
interface LLMConfig {
  apiKey: string;
  baseUrl: string; // OpenCode Zen API endpoint
  models: string[]; // Lista ordenada de modelos free
  timeout: number; // Default 30s
  maxRetries: number; // Default 2 (por modelo)
}

interface LLMResponse {
  content: string;
  model: string; // Qué modelo respondió
  tokensUsed: { prompt: number; completion: number };
}

interface LLMError {
  code: "all_models_failed" | "invalid_response" | "timeout" | "rate_limited";
  attempts: { model: string; error: string }[];
}
```

**Protocolo OpenAI-compatible:**
Los modelos free de OpenCode Zen usan la API estándar OpenAI (`/v1/chat/completions`).
Gemini 3.5 Flash usa el SDK oficial `@google/genai` (API Gemini nativa, no OpenAI-compatible).
El cliente `llm-provider.ts` tiene 2 clientes internos (uno por provider) y los orquesta.

### 3.2 Prompts estructurados con contexto

Cada agente tiene un **system prompt** específico que incluye:

- Rol del agente y objetivo
- Contexto del CRM (schema de datos, stages del pipeline, estados válidos)
- Formato de salida esperado (JSON schema estricto)
- Few-shot examples (1-2 ejemplos por tipo de tarea)
- Restricciones (no inventar datos, confianza entre 0.0-1.0, etc.)

### 3.3 Formato de salida esperado

Todos los agentes reciben respuestas en JSON estructurado. El schema se incluye
en el system prompt y se valida al parsear. Si el LLM no devuelve JSON válido,
se reintenta una vez con un prompt más explícito; si falla, se degrada a
heurísticas deterministas.

**Schemas de respuesta:**

```typescript
// Auditor — clasificación de evento Stripe
interface EventClassification {
  type:
    | "payment_success"
    | "payment_failed"
    | "subscription_created"
    | "subscription_updated"
    | "subscription_cancelled"
    | "unknown";
  severity: "info" | "warning" | "critical";
  summary: string;
  requiresAction: boolean;
}

// Diagnosticador — hipótesis de fallo
interface DiagnosticResult {
  diagnosis: string;
  hypotheses: Array<{
    cause: string;
    confidence: number; // 0.0 - 1.0
    evidence: string[];
    suggestedAction: string;
  }>;
  context: {
    dealId?: string;
    contactId?: string;
    relevantInvoices?: string[];
  };
}

// Reparador — resultado de acción
interface RepairResult {
  action: string;
  status: "success" | "failed" | "skipped";
  details: string;
  crmEndpointCalled?: string;
}
```

### 3.4 Contexto CRM inyectado en prompts

El system prompt de cada agente incluye dinámicamente:

- **Stages del pipeline** (9 stages con orden, nombres, colores)
- **Productos del catálogo** (desde `catalog.ts`)
- **Schema de Contact/Deal/Invoice** (campos y tipos)
- **Reglas de transición** (lineal, "Cerrado perdido" desde stage 3+)
- **Estados de Invoice** (pending_transfer, paid, cancelled)
- **Estados de Subscription** (active, past_due, cancelled)

Este contexto se cachea en memoria (no cambia entre requests) y se inyecta
en el primer mensaje del system prompt.

### 3.5 Degradación

Sin `GEMINI_API_KEY` Y sin `OPENCODE_ZEN_API_KEY` → los agentes usan solo lógica determinista:

- Auditor: reglas de conteo (≥3 fallos/5min) + detección de deals estancados (query Prisma)
- Diagnosticador: heurísticas basadas en tipo de error HTTP
- Reparador: reintentos directos vía CRM (sin LLM)

Los agentes nunca crashean. Siempre devuelven una respuesta válida.

## 4. Agentes — Comportamiento

### 4.1 Agente Auditor

**Disparadores:**

- **Cron externo** (producción): Vercel Cron Job o cron del servidor que llama `POST /api/agents/audit` cada 15 min. El endpoint es idempotente.
- **Desarrollo**: `pnpm dev` no ejecuta cron. Usar trigger manual o curl.
- Manual: `POST /api/agents/audit`
- Webhook: `POST /api/agents/hooks` (eventos Stripe)

**Funciones:**

1. **Clasificación de eventos Stripe** — recibe el evento, lo clasifica con LLM
   (o reglas deterministas si no hay LLM)
2. **Detección de anomalías** — ≥3 fallos de checkout en 5 min → alerta critical
3. **Auditoría de deals estancados** — deals >7 días sin cambio de stage → warning
4. **Generación de alertas** — logs estructurados + email vía Resend (si hay API key)

**Endpoints:**

- `POST /api/agents/hooks` — recibe eventos Stripe (mismo payload que webhook)
- `POST /api/agents/audit` — trigger manual de auditoría completa

### 4.2 Agente Diagnosticador

**Disparador:** `POST /api/agents/diagnose`

**Input:**

```typescript
interface DiagnoseRequest {
  context: string; // Descripción del problema
  error?: string; // Mensaje de error si existe
  dealId?: string; // Deal relacionado (opcional)
  contactId?: string; // Contacto relacionado (opcional)
}
```

**Funciones:**

1. Consulta CRM API para obtener datos del deal/contacto/invoices
2. Formula hipótesis con confianza (0.0-1.0)
3. Sugiere acciones concretas de reparación

**Causas que puede diagnosticar:**

- DB caída (Prisma no responde)
- Stripe API down (errores 5xx)
- Rate-limit excedido (429)
- Error de red (timeout, connection refused)
- Datos inconsistentes (deal sin stage, invoice sin items)
- Checkout fallido recurrente

### 4.3 Agente Reparador

**Disparador:** `POST /api/agents/repair`

**Input:**

```typescript
interface RepairRequest {
  diagnosis: DiagnosticResult; // Del Diagnosticador
  dealId?: string;
  dryRun?: boolean; // Default false
}
```

**Funciones:**

1. Reintentar persistencia vía CRM API (crear/actualizar registros)
2. Regenerar Payment Link vía Stripe (si hay clave)
3. Crear Task de follow-up en CRM
4. Avanzar deal a stage correcto si está desincronizado

**El Reparador usa LLM para generar el plan de acción.** Recibe el diagnóstico del
Diagnosticador (causa raíz + confianza + acción sugerida), consulta el LLM para
decidir QUÉ acción correctiva aplicar y generar el PAYLOAD adecuado para la CRM API,
y luego ejecuta deterministamente la acción. El LLM propone, el código ejecuta. La
ejecución siempre es determinista (no hay riesgo de que el LLM invoque APIs por su
cuenta): el Reparador parsea la respuesta del LLM (JSON estructurado con `action`,
`endpoint`, `payload`), valida con Zod contra el schema del endpoint CRM, y solo
entonces hace `fetch` a `/api/crm/*`.

## 5. Evaluación (F15b)

### 5.1 Tests de utilidad (15.7)

Evalúan si los diagnósticos del agente son **correctos y útiles**.

**Mecanismo híbrido:**

1. **Generación de escenarios** — un LLM capaz genera casos de prueba con:
   - Contexto (estado del CRM, errores, logs)
   - Diagnóstico esperado (ground truth)
   - Acción esperada
2. **Ejecución** — el Diagnosticador/Reparador procesa cada escenario
3. **Evaluación determinista** — assertions sobre:
   - ¿La hipótesis principal coincide con el diagnóstico esperado?
   - ¿La confianza está en el rango correcto (±0.2)?
   - ¿La acción sugerida es del tipo correcto?
4. **Evaluación LLM-as-judge** — un modelo capaz evalúa:
   - ¿El diagnóstico es razonable dado el contexto?
   - ¿La explicación es clara y accionable?

### 5.2 Tests de cumplimiento (15.8)

Evalúan que los agentes **respeten el contrato CRM API**.

**Mecanismo determinista:**

1. Los agentes llaman al CRM API vía `crm-client.ts`
2. Los tests verifican con `vi.spyOn` / mocks que:
   - Se llamen los endpoints correctos (método, ruta)
   - Los payloads cumplan el schema Zod del endpoint
   - Se envíe el header `X-API-Key`
   - Se manejen errores HTTP correctamente (no crash en 4xx/5xx)
3. Tests de integración reales contra CRM API mockeada

## 6. Testing (31 tests)

### F15a (21 tests)

| Fichero                  | Tests | Cubre                                                               |
| ------------------------ | ----- | ------------------------------------------------------------------- |
| `llm.test.ts`            | 5     | Factory, fallback entre modelos, timeout, rate-limit, sin API key   |
| `crm-client.test.ts`     | 3     | Auth, errores HTTP, timeout                                         |
| `auditor.test.ts`        | 5     | Clasificación evento, anomalías, deals estancados, sin LLM, webhook |
| `diagnosticador.test.ts` | 4     | Hipótesis, confianza, sin LLM, formato respuesta                    |
| `reparador.test.ts`      | 3     | Reintento, Task, fallo                                              |
| `health.test.ts`         | 1     | Health check con/sin LLM                                            |

### F15b (10 tests)

| Fichero                     | Tests | Cubre                                                                   |
| --------------------------- | ----- | ----------------------------------------------------------------------- |
| `eval/utilidad.test.ts`     | 5     | Escenarios correctos, confianza rango, acción tipo, LLM judge, sin LLM  |
| `eval/cumplimiento.test.ts` | 5     | Endpoint correcto, payload schema, auth header, error handling, dry-run |

### Gate de cobertura

F15 sube el gate a: **87/72/94/89** (stmts/brchs/funcs/lines).

## 7. Configuración (env vars)

| Variable                | Requerida | Default                                                      | Descripción                                             |
| ----------------------- | --------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `GEMINI_API_KEY`        | No        | —                                                            | API key para Gemini 3.5 Flash (Google, gratuita)        |
| `OPENCODE_ZEN_API_KEY`  | No        | —                                                            | API key para OpenCode Zen free models                   |
| `OPENCODE_ZEN_BASE_URL` | No        | `https://api.opencode.ai/v1`                                 | Endpoint API                                            |
| `OPENCODE_ZEN_MODELS`   | No        | `deepseek-v4-flash-free,mimo-v2.5-free,north-mini-code-free` | Modelos separados por coma (orden = prioridad fallback) |
| `CRM_API_KEY`           | No        | —                                                            | Ya existe (F14). Auth para CRM API                      |
| `AGENT_AUDIT_INTERVAL`  | No        | `900000`                                                     | Intervalo cron auditor (ms)                             |
| `RESEND_API_KEY`        | No        | —                                                            | Ya existe (F4). Para alertas email                      |

Todas null-safe. La app arranca y funciona sin ninguna de estas.

## 8. Degradación — Matriz completa

| Estado                   | Auditor                           | Diagnosticador            | Reparador                   |
| ------------------------ | --------------------------------- | ------------------------- | --------------------------- |
| LLM + CRM + DB           | Clasificación IA + alertas        | Diagnóstico IA completo   | Reparación automática       |
| CRM + DB (sin LLM)       | Reglas deterministas              | Heurísticas HTTP          | Reparación automática       |
| Solo DB (sin LLM ni CRM) | Deals estancados (Prisma directo) | "Sin contexto suficiente" | Reintento directo (sin LLM) |
| Sin nada                 | Logs only                         | 503                       | 503                         |

Ninguna combinación de dependencias faltantes causa crash.

## 9. Split F15a / F15b

### F15a — Agentes funcionales (15.1-15.6)

| #    | Tarea                                            | Dependencia      |
| ---- | ------------------------------------------------ | ---------------- |
| 15.1 | Config + LLM client (OpenCode Zen)               | —                |
| 15.2 | Prompts + schemas (contexto CRM, formato salida) | 15.1             |
| 15.3 | CRM client interno                               | —                |
| 15.4 | Agente Auditor + routes                          | 15.1, 15.2, 15.3 |
| 15.5 | Agente Diagnosticador + routes                   | 15.1, 15.2, 15.3 |
| 15.6 | Agente Reparador + routes + health               | 15.5             |
| 15.7 | Degradación sin LLM (tests)                      | 15.4-15.6        |

### F15b — Hardening (15.8-15.9)

| #    | Tarea                                         | Dependencia |
| ---- | --------------------------------------------- | ----------- |
| 15.8 | Tests de utilidad (eval calidad diagnósticos) | F15a        |
| 15.9 | Tests de cumplimiento (eval contrato CRM)     | F15a        |

## 10. Orden de implementación (vertical slices)

```
F15a:
  Slice 1: 15.1 (config + LLM) + 15.2 (prompts + schemas) + 15.3 (CRM client)
           → 8 tests, infraestructura base
  Slice 2: 15.4 (Auditor) completo con tests y route
           → 5 tests, primer agente funcional
  Slice 3: 15.5 (Diagnosticador) completo con tests y route
           → 4 tests, segundo agente
  Slice 4: 15.6 (Reparador + health) + 15.7 (degradación)
           → 4 tests, sistema completo con degradación

F15b:
  Slice 5: 15.8 (utilidad) + 15.9 (cumplimiento)
           → 10 tests, hardening completo
```

Cada slice es verificable independientemente (tests green, typecheck, lint).

## 11. No-objetivos

- UI administrativa para agentes (la API basta)
- Dashboard de métricas de agentes
- Agentes asíncronos con colas (usamos sync + cron)
- Multi-tenancy
- Historial persistente de diagnósticos (logs bastan por ahora)

## 12. Criterios de aceptación

| ID   | Criterio                                                     |
| ---- | ------------------------------------------------------------ |
| AC1  | `GET /api/agents/health` → 200 con estado de LLM y CRM       |
| AC2  | `POST /api/agents/hooks` clasifica eventos Stripe            |
| AC3  | `POST /api/agents/audit` detecta deals estancados            |
| AC4  | `POST /api/agents/diagnose` devuelve hipótesis con confianza |
| AC5  | `POST /api/agents/repair` ejecuta acciones de reparación     |
| AC6  | Sin LLM → agentes usan lógica determinista (no crash)        |
| AC7  | Sin CRM API key → 503                                        |
| AC8  | 31 tests green (21 F15a + 10 F15b)                           |
| AC9  | Cobertura ≥87/72/94/89                                       |
| AC10 | Lint 0 errors                                                |
| AC11 | Typecheck 0 errors                                           |
| AC12 | Build verde                                                  |
