import type { Addon, ComparisonRow, FaqItem, HomeService, Tiers } from "./types";

// NOTA: todos los precios son PLACEHOLDER. TODO: fijar tarifas reales antes de
// publicar (y sincronizar los importes de `checkout.ts`).
export const HOME_SERVICES: HomeService[] = [
  {
    name: "Seguridad & verificación",
    sub: "Auditorías check-only de repos, apps y hosts (SAST/SCA/DAST, IaC, RGPD). Informe priorizado + propuesta.",
    price: "TODO: desde €—",
  },
  {
    name: "MCP & tooling",
    sub: "Servidores MCP, gateways de credenciales y herramientas para Claude Code, con plantillas y validación.",
    price: "TODO: desde €—",
  },
  {
    name: "Fullstack web",
    sub: "Sitios y apps en Next.js 15/16 · React 19 · TypeScript, con backend propio y despliegue en Vercel.",
    price: "TODO: desde €—",
  },
  {
    name: "Infra & observabilidad",
    sub: "Secretos (Vault), mTLS, contenedores y telemetría con OpenTelemetry → SigNoz. Sistemas auditables.",
    price: "TODO: €—/hora",
  },
];

// TODO: revisar precios y características de cada tier según tu oferta real.
export const TIERS: Tiers = {
  proyecto: [
    {
      name: "Starter",
      price: "TODO: €—",
      unit: "/proyecto",
      feats: [
        ["Sitio o herramienta acotada", true],
        ["Hasta 5 vistas/comandos", true],
        ["Responsive + SEO base", true],
        ["Backend propio", false],
        ["Soporte 30 días", false],
      ],
    },
    {
      name: "Pro",
      price: "TODO: €—",
      unit: "/proyecto",
      pro: true,
      feats: [
        ["App o servicio fullstack", true],
        ["Auth, datos y backend propio", true],
        ["CI/CD + tests automatizados", true],
        ["Soporte 60 días", true],
        ["Documentación técnica", true],
      ],
    },
    {
      name: "Scale",
      price: "TODO: €—+",
      unit: "/proyecto",
      feats: [
        ["Arquitectura a medida", true],
        ["Seguridad y observabilidad", true],
        ["Hardening + auditoría", true],
        ["SLA y on-call", true],
        ["Roadmap conjunto", true],
      ],
    },
  ],
  retainer: [
    {
      name: "Starter",
      price: "TODO: €—",
      unit: "/mes",
      feats: [
        ["TODO h/mes", true],
        ["Mantenimiento y monitoring", true],
        ["Corrección de bugs", true],
        ["Features nuevas", false],
        ["On-call", false],
      ],
    },
    {
      name: "Pro",
      price: "TODO: €—",
      unit: "/mes",
      pro: true,
      feats: [
        ["TODO h/mes", true],
        ["Features nuevas", true],
        ["Code & security reviews", true],
        ["Canal directo", true],
        ["Reporte semanal", true],
      ],
    },
    {
      name: "Scale",
      price: "TODO: €—",
      unit: "/mes",
      feats: [
        ["Dedicación parcial (80%+)", true],
        ["Roadmap conjunto", true],
        ["Arquitectura y ADRs", true],
        ["On-call 24/7", true],
        ["SLA garantizado", true],
      ],
    },
  ],
};

export const COMPARISON: ComparisonRow[] = [
  ["Desarrollo a medida", [true, true, true]],
  ["Backend propio", [false, true, true]],
  ["Tests automatizados", [false, true, true]],
  ["CI/CD", [false, true, true]],
  ["Seguridad & observabilidad", [false, true, true]],
  ["SLA & on-call", [false, false, true]],
];

// TODO: fijar precios reales (sincronizar con PURCHASABLES en checkout.ts).
export const ADDONS: Addon[] = [
  {
    name: "Auditoría de seguridad",
    desc: "Verificación check-only (XEK) de repo, app o host: SAST/SCA/DAST, IaC y compliance. Informe priorizado con propuesta.",
    price: "TODO: €—",
  },
  {
    name: "Sesión de mentoría",
    desc: "Acompañamiento técnico en seguridad, MCP/Claude Code, Rust o arquitectura web. 1 hora.",
    price: "TODO: €—/hora",
  },
  {
    name: "Sprint de hardening",
    desc: "1-2 semanas asegurando secretos, mTLS, observabilidad y CI: de configuración frágil a sistema auditable.",
    price: "TODO: €—",
  },
];

export const FAQ: FaqItem[] = [
  {
    q: "¿Cómo es tu proceso de trabajo?",
    a: "Empiezo con una llamada de descubrimiento para entender el problema real. Entrego una propuesta con alcance, hitos y precio cerrado antes de empezar, y trabajo en iteraciones cortas con demos y feedback continuo.",
  },
  {
    q: "¿Qué pasa si el alcance cambia?",
    a: "Los cambios pequeños van incluidos. Para cambios significativos, paro, evaluamos juntos el impacto y acordamos el ajuste antes de continuar. Sin sorpresas en la factura final.",
  },
  {
    q: "¿Trabajas con seguridad sin modificar mis sistemas?",
    a: "Sí. Mi enfoque (XEK) es check-only: verifico y razono, no modifico. Recibes un informe con hallazgos y una propuesta de remediación; la acción correctiva es siempre una decisión tuya.",
  },
  {
    q: "¿Cómo te integras con equipos existentes?",
    a: "Trabajo en el repositorio del cliente y con su metodología. Me integro como un ingeniero más: code reviews, pair programming y documentación donde el equipo ya trabaja.",
  },
];
