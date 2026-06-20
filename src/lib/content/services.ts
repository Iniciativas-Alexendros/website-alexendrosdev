import type { Addon, ComparisonRow, FaqItem, HomeService, Tiers } from "./types";

// Precios base ORIENTATIVOS (EUR), contenidos para empresas nuevas y pequeñas
// (foco en desarrollo de plataformas/web/apps). Ancla ≈ €40-45/h. Públicos en
// formato «desde». TODO: revisar/ajustar a tu criterio antes de cerrar tarifas.
export const HOME_SERVICES: HomeService[] = [
  {
    name: "Landing de 1 página",
    sub: "Una página bien hecha para presentar tu negocio o producto: diseño a medida, rápida y adaptada a móvil, con un formulario de contacto. El punto de entrada más sencillo.",
    price: "desde €600",
  },
  {
    name: "Webs y aplicaciones a medida",
    sub: "Tu sitio o tu app, de la idea al lanzamiento: diseño, desarrollo y puesta en marcha con tecnología moderna que carga rápido y se ve bien en cualquier pantalla.",
    price: "desde €1.200",
  },
  {
    name: "Plataformas y producto digital",
    sub: "Cuando necesitas algo más que una web: paneles de gestión, áreas privadas, pagos e integraciones con las herramientas que ya usas, listas para crecer contigo.",
    price: "desde €2.900",
  },
  {
    name: "Automatización y herramientas internas",
    sub: "Herramientas a medida que ahorran horas a tu equipo: automatizo tareas repetitivas y conecto tus sistemas para que trabajen solos.",
    price: "a consultar",
  },
  {
    name: "Revisión de seguridad",
    sub: "Reviso tu web o tu sistema y te explico, en cristiano, qué conviene mejorar para estar tranquilo. Solo reviso: no toco nada sin tu visto bueno.",
    price: "desde €600",
  },
];

// Precios base orientativos y contenidos (pymes/startups). TODO: verificar antes de publicar.
export const TIERS: Tiers = {
  proyecto: [
    {
      name: "Starter",
      price: "€1.200",
      unit: "/proyecto",
      feats: [
        ["Sitio web o herramienta acotada", true],
        ["Hasta 5 páginas", true],
        ["Adaptable a móvil + SEO base", true],
        ["Backend a medida", false],
        ["Soporte 30 días", false],
      ],
    },
    {
      name: "Pro",
      price: "€2.900",
      unit: "/proyecto",
      pro: true,
      feats: [
        ["Aplicación o plataforma completa", true],
        ["Acceso de usuarios, datos y backend", true],
        ["Pruebas automáticas y despliegue continuo", true],
        ["Soporte 60 días", true],
        ["Documentación de uso", true],
      ],
    },
    {
      name: "Scale",
      price: "€5.900+",
      unit: "/proyecto",
      feats: [
        ["Arquitectura a medida", true],
        ["Buenas prácticas de seguridad", true],
        ["Monitorización y alertas", true],
        ["Soporte prioritario", true],
        ["Hoja de ruta conjunta", true],
      ],
    },
  ],
  retainer: [
    {
      name: "Starter",
      price: "€690",
      unit: "/mes",
      feats: [
        ["20 h/mes", true],
        ["Mantenimiento y monitorización", true],
        ["Corrección de errores", true],
        ["Funcionalidades nuevas", false],
        ["Soporte prioritario", false],
      ],
    },
    {
      name: "Pro",
      price: "€1.290",
      unit: "/mes",
      pro: true,
      feats: [
        ["40 h/mes", true],
        ["Funcionalidades nuevas", true],
        ["Revisiones de código", true],
        ["Canal directo", true],
        ["Informe semanal", true],
      ],
    },
    {
      name: "Scale",
      price: "€1.990",
      unit: "/mes",
      feats: [
        ["70 h/mes (media jornada)", true],
        ["Hoja de ruta conjunta", true],
        ["Arquitectura y decisiones documentadas", true],
        ["Soporte prioritario", true],
        ["Acuerdo de servicio (SLA)", true],
      ],
    },
  ],
};

export const COMPARISON: ComparisonRow[] = [
  ["Desarrollo a medida", [true, true, true]],
  ["Backend a medida", [false, true, true]],
  ["Pruebas automáticas", [false, true, true]],
  ["Despliegue continuo", [false, true, true]],
  ["Seguridad y monitorización", [false, true, true]],
  ["Acuerdo de servicio y soporte prioritario", [false, false, true]],
];

// Items puntuales (sincronizados con PURCHASABLES en checkout.ts).
export const ADDONS: Addon[] = [
  {
    name: "Puesta a punto de tu web",
    desc: "Reviso tu web actual (velocidad, posicionamiento en Google y errores) y te entrego un informe claro con las mejoras priorizadas.",
    price: "€390",
  },
  {
    name: "Sesión de consultoría",
    desc: "Hablamos de tu proyecto y te ayudo a decidir cómo abordar tu web, tu aplicación o una automatización. 1 hora, sin compromiso.",
    price: "€60/hora",
  },
  {
    name: "Revisión de seguridad",
    desc: "Reviso tu web o tu sistema y te explico, en cristiano, qué conviene mejorar para estar tranquilo. Solo reviso: no toco nada sin tu visto bueno.",
    price: "desde €600",
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
    q: "¿Y la seguridad de lo que construyes?",
    a: "Va incluida de serie: todo lo que desarrollo se construye con buenas prácticas desde el principio. Si además quieres que revise una web o un sistema que ya tienes, lo hago sin tocar nada: te entrego un informe claro con lo que conviene mejorar y tú decides.",
  },
  {
    q: "¿De quién es el código que entregas?",
    a: "Tuyo. Trabajo con software libre siempre que es posible y el cliente es dueño de su código e infraestructura: sin lock-in, con todo documentado y reproducible para que tu equipo pueda mantenerlo.",
  },
];
