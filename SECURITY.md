# Política de seguridad

## Versiones soportadas

| Versión | Soportada          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| otras   | :x:                |

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en `alexendros.dev`, **no abras
un issue público**.

Reporta de forma privada a través de:

- **Email:** security@alexendros.dev
- **GitHub Security Advisories:** pestaña _Security → Report a vulnerability_
  en el repositorio.

Compromiso de respuesta:

- Acuse de recibo en **72h**.
- Evaluación inicial y plan de mitigación en **7 días**.
- Crédito en el `CHANGELOG.md` salvo que pidas anonimato.

## Alcance

Cubierto:

- Endpoints de API (`/api/*`) y autenticación CRM (X-API-Key).
- Manejo de secretos y variables de entorno.
- Cabeceras de seguridad, CSP y superficie de ataque del sitio.

Fuera de alcance (third-party):

- Infraestructura de Vercel, Stripe, Supabase o Resend.
- Fallos en dependencias — repórtalos igualmente y los escalamos al maintainer.

## Buenas prácticas del repo

- `pnpm gitleaks` bloquea commits con secretos (Husky pre-commit).
- `CodeQL` y `Semgrep` corren en CI (push/PR/semanal).
- Las rutas `/api/agents/*` usan `requireCrmAuth` (timingSafeEqual + rate-limit).
