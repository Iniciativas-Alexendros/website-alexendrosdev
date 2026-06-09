import type { Addon, ComparisonRow, FaqItem, HomeService, Tiers } from "./types";

// Precios base ORIENTATIVOS (EUR), pensados para freelance senior en España con
// foco en seguridad/infra/fullstack. Ancla ≈ €60-65/h. Públicos en formato
// «desde». TODO: revisar/ajustar a tu criterio antes de cerrar tarifas.
export const HOME_SERVICES: HomeService[] = [
  {
    name: "Seguridad & auditoría",
    sub: "Auditorías check-only (XEK): SAST/SCA/DAST, IaC y compliance/RGPD. Informe priorizado + propuesta.",
    price: "desde €1.500",
  },
  {
    name: "Fullstack web",
    sub: "Sitios y apps en Next.js 15/16 · React 19 · TypeScript, con backend propio y despliegue en Vercel.",
    price: "desde €3.500",
  },
  {
    name: "Infra & hardening",
    sub: "Secretos (Vault), mTLS, contenedores y observabilidad (OpenTelemetry → SigNoz). Sistemas auditables.",
    price: "desde €2.500",
  },
  {
    name: "MCP & tooling",
    sub: "Servidores MCP, gateways de credenciales y herramientas para Claude Code, con plantillas y validación.",
    price: "a consultar",
  },
];

// Precios base orientativos. TODO: verificar antes de publicar.
export const TIERS: Tiers = {
  proyecto: [
    {
      name: "Starter",
      price: "€2.500",
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
      price: "€6.500",
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
      price: "€14.000+",
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
      price: "€1.250",
      unit: "/mes",
      feats: [
        ["20 h/mes", true],
        ["Mantenimiento y monitoring", true],
        ["Corrección de bugs", true],
        ["Features nuevas", false],
        ["On-call", false],
      ],
    },
    {
      name: "Pro",
      price: "€2.600",
      unit: "/mes",
      pro: true,
      feats: [
        ["40 h/mes", true],
        ["Features nuevas", true],
        ["Code & security reviews", true],
        ["Canal directo", true],
        ["Reporte semanal", true],
      ],
    },
    {
      name: "Scale",
      price: "€4.500",
      unit: "/mes",
      feats: [
        ["70 h/mes (media jornada)", true],
        ["Roadmap conjunto", true],
        ["Arquitectura y ADRs", true],
        ["On-call", true],
        ["SLA acordado", true],
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

// Items puntuales (sincronizados con PURCHASABLES en checkout.ts).
export const ADDONS: Addon[] = [
  {
    name: "Auditoría de seguridad",
    desc: "Verificación check-only (XEK) de repo, app o host: SAST/SCA/DAST, IaC y compliance. Informe priorizado con propuesta.",
    price: "desde €1.500",
  },
  {
    name: "Sesión de mentoría",
    desc: "Acompañamiento técnico en seguridad, MCP/Claude Code, Rust o arquitectura web. 1 hora.",
    price: "€90/hora",
  },
  {
    name: "Sprint de hardening",
    desc: "1-2 semanas asegurando secretos, mTLS, observabilidad y CI: de configuración frágil a sistema auditable.",
    price: "desde €2.500",
  },
];

export const FAQ: FaqItem[] = [
  {
    q: "¿Cómo es tu proceso de trabajo?",
    a: "Empiezo con una llamada de descubrimiento para entender el problema real. Entrego una propuesta con alcance, hitos y precio cerrado antes de empezar, y trabajo en iteraciones cortas con demos y feedback continuo.",
  },
  {
    q: "¿Los precios son cerrados?",
    a: "Sí. Las tarifas que ves son orientativas («desde»); tras la llamada de descubrimiento te paso un precio cerrado por el alcance acordado. Los cambios pequeños van incluidos; para cambios significativos, paro, evaluamos juntos el impacto y lo acordamos antes de continuar.",
  },
  {
    q: "¿Trabajas con seguridad sin modificar mis sistemas?",
    a: "Sí. Mi enfoque (XEK) es check-only: verifico y razono, no modifico. Recibes un informe con hallazgos y una propuesta de remediación; la acción correctiva es siempre una decisión tuya.",
  },
  {
    q: "¿De quién es el código que entregas?",
    a: "Tuyo. Trabajo con software libre siempre que es posible y el cliente es dueño de su código e infraestructura: sin lock-in, con todo documentado y reproducible para que tu equipo pueda mantenerlo.",
  },
];
