# Checklist del operador — Desbloquear F17 (Monitorización) y F18 (Contenido & Marketing)

> Fuente de verdad del código: `.env.example`, `src/lib/email.ts`,
> `src/app/api/health/route.ts`, `src/app/api/newsletter/send/route.ts`,
> `src/instrumentation.ts`, `src/app/layout.tsx` y `ROADMAP.md`.
>
> La app es **null-safe**: arranca y responde 200 aunque falten credenciales.
> Sin embargo, F17 y F18 no están completamente operativas hasta que el operador
> configure las variables y servicios de esta lista.

---

## F18 — Contenido & Marketing (Track P1, prioridad)

| #     | Acción                                                                         | Bloquea                                            | Variable/credencial necesaria                  | Cómo verificar                                         |
| ----- | ------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| F18.1 | **Crear cuenta en Resend** y añadir dominio verificado (alexendros.dev).       | Envío real de emails transaccionales y newsletter. | `RESEND_API_KEY` (desde Dashboard de Resend)   | `GET /api/health` debe devolver `resend: { ok: true }` |
| F18.2 | **Configurar remitente por defecto** en Vercel.                                | Emails sin remitente válido rebotan.               | `EMAIL_FROM="Nombre <noreply@alexendros.dev>"` | Envío de prueba desde `/api/contact`                   |
| F18.3 | **Configurar destinatario de leads** en Vercel.                                | Notificación de contacto no llega.                 | `CONTACT_TO_EMAIL=hola@alexendros.dev`         | Envío de formulario de contacto                        |
| F18.4 | **Verificar DNS de dominio** (SPF/DKIM/DMARC) en Resend.                       | Emails caen en spam.                               | —                                              | Test de entrega a Gmail/Outlook                        |
| F18.5 | **Crear calendario editorial** en `content/blog/editorial-calendar.md`.        | Plan de contenido no versionado.                   | —                                              | Existe el archivo con >= 4 posts planificados          |
| F18.6 | **Escribir 2 posts MDX** en `content/blog/`.                                   | Blog vacío.                                        | —                                              | `/blog` muestra 2 posts                                |
| F18.7 | **Crear templates de newsletter** (`monthly.tsx`, `announcement.tsx`).         | Envío masivo inconsistente.                        | —                                              | Tests renderizan el email                              |
| F18.8 | **Configurar `CRM_API_KEY`** para proteger `POST /api/newsletter/send`.        | Endpoint de envío masivo desprotegido.             | `CRM_API_KEY`                                  | Petición con `X-API-Key` válida devuelve 200/201       |
| F18.9 | **Definir objetivos de conversión** en Vercel Analytics o herramienta externa. | No se miden conversiones.                          | —                                              | Dashboard muestra eventos de conversión                |

### Resultado de F18

- Emails transaccionales y newsletter funcionan.
- Blog activo con 2+ posts.
- Envío masivo protegido y operativo.
- Analytics con objetivos de conversión configurados.

---

## F17 — Monitorización full-stack (Track P2, paralelo)

| #     | Acción                                                                                       | Bloquea                               | Variable/credencial necesaria                                           | Cómo verificar                                        |
| ----- | -------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| F17.1 | **Asegurar que `GET /api/health` es accesible** públicamente.                                | Uptime monitor y alertas.             | `NEXT_PUBLIC_BASE_URL` ya apunta a `https://alexendros.dev`             | `curl https://alexendros.dev/api/health` devuelve 200 |
| F17.2 | **Configurar monitor externo** (Uptime Robot / cron-job.org) para ping cada 5 min.           | No se detectan caídas.                | Cuenta gratuita en Uptime Robot o cron-job.org                          | Dashboard del servicio muestra checks                 |
| F17.3 | **Desplegar SigNoz** en MiniPC (Docker) o usar cloud.                                        | No hay donde recibir trazas/métricas. | Endpoint SigNoz (self-hosted)                                           | `curl http://<signoz>:3301` responde                  |
| F17.4 | **Configurar `OTEL_EXPORTER_OTLP_ENDPOINT`** en Vercel.                                      | Traces no salen de la app.            | `OTEL_EXPORTER_OTLP_ENDPOINT=https://signoz.alexendros.cloud/v1/traces` | Traces aparecen en SigNoz                             |
| F17.5 | **Configurar `OTEL_EXPORTER_OTLP_HEADERS`** si SigNoz requiere auth.                         | Auth del collector rechaza trazas.    | `OTEL_EXPORTER_OTLP_HEADERS=signoz-access-token=<token>`                | 200 OK en exportación OTel                            |
| F17.6 | **Configurar alertas de uptime** vía email/Resend cuando `RESEND_API_KEY` esté disponible.   | Sin canal de alerta.                  | `RESEND_API_KEY` + `CONTACT_TO_EMAIL`                                   | Email de prueba recibido tras fallo simulado          |
| F17.7 | **(Opcional) Configurar dashboard Supabase** para conexiones y slow queries.                 | No se monitoriza la DB.               | Acceso a Supabase/Coolify                                               | Dashboard de Supabase activo                          |
| F17.8 | **(Opcional) Script de health de MiniPC** (`/opt/health/minipc-health.sh`) + endpoint local. | No se monitoriza infra del MiniPC.    | Acceso SSH al MiniPC                                                    | Endpoint local devuelve JSON                          |

### Resultado de F17

- `/api/health` accesible y monitorizado.
- SigNoz recibe trazas de Next.js.
- Alertas por email configuradas (cuando Resend esté activo).
- Dashboards de salud operativos.

---

## Tabla resumen de variables y credenciales

| Variable / Credencial               | Fase      | Obligatoria              | Efecto si falta                                    | Origen                    |
| ----------------------------------- | --------- | ------------------------ | -------------------------------------------------- | ------------------------- |
| `RESEND_API_KEY`                    | F18 + F17 | Sí (para F18 completo)   | Emails/newsletter degradan a log; alertas no salen | Dashboard Resend          |
| `EMAIL_FROM`                        | F18       | Recomendada              | Usa fallback `Portfolio <onboarding@resend.dev>`   | Configuración propia      |
| `CONTACT_TO_EMAIL`                  | F18       | Recomendada              | Usa fallback `contacto@alexendros.dev`             | Configuración propia      |
| `CRM_API_KEY`                       | F18.5     | Sí                       | Endpoint newsletter/send responde 503              | Generada por operador     |
| `NEXT_PUBLIC_BASE_URL`              | F18 + F17 | Ya configurada           | Emails/links rotos                                 | `https://alexendros.dev`  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`       | F17       | Sí (para F17 completo)   | No hay telemetría                                  | Endpoint SigNoz propio    |
| `OTEL_EXPORTER_OTLP_HEADERS`        | F17       | Si SigNoz requiere auth  | Rechazo de trazas                                  | Configuración SigNoz      |
| Cuenta SigNoz (self-hosted o cloud) | F17       | Sí                       | Sin dashboards ni trazas                           | MiniPC / SigNoz Cloud     |
| Cuenta Uptime Robot / cron-job.org  | F17       | Sí (para uptime externo) | Sin monitorización de caídas                       | Servicio externo gratuito |

---

## Checklist rápido del operador

- [ ] Alta en Resend y verificación de dominio `alexendros.dev`
- [ ] Añadir `RESEND_API_KEY` a Vercel (producción)
- [ ] Configurar `EMAIL_FROM` y `CONTACT_TO_EMAIL` en Vercel
- [ ] Generar y añadir `CRM_API_KEY` a Vercel
- [ ] Verificar envío de email de contacto y newsletter
- [ ] Crear `content/blog/editorial-calendar.md` con 4 posts planificados
- [ ] Escribir y publicar 2 posts MDX
- [ ] Definir objetivos de conversión en analytics
- [ ] Desplegar/verificar SigNoz en MiniPC
- [ ] Configurar `OTEL_EXPORTER_OTLP_ENDPOINT` (y headers si aplica) en Vercel
- [ ] Crear monitor externo (Uptime Robot / cron-job.org) apuntando a `/api/health`
- [ ] Configurar alertas de uptime vía Resend una vez activo

---

## Notas de verificación

- Tras cada cambio de variable en Vercel, redeploy automático en push a `main`.
- Validar con: `pnpm verify` (format, lint, typecheck, tests, build).
- Endpoint de prueba: `curl -s https://alexendros.dev/api/health | jq`.

---

_Generado a partir del estado actual del repo. Actualizar cuando F17/F18 avancen._
