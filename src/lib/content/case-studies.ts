import type { Project } from "./types";

export interface CaseBlock {
  type: "p" | "callout" | "code" | "figure" | "quote";
  text?: string;
  // code
  file?: string;
  code?: string;
  // figure
  label?: string;
  caption?: string;
  // quote
  author?: string;
}

export interface CaseSection {
  id: string;
  title: string;
  blocks: CaseBlock[];
}

export interface CaseStudy {
  summary: string;
  role: string;
  duration: string;
  client: string;
  sections: CaseSection[];
}

// Estudio curado para el proyecto destacado.
const STUDIES: Record<string, CaseStudy> = {
  nasve: {
    summary:
      "Demo / plantilla de e-commerce para imprentas y copisterías: un sitio con catálogo, tienda y un configurador de encargos que termina en una solicitud de presupuesto. Es un ejemplo construido de principio a fin para mostrar cómo abordaría un proyecto de este tipo, no un despliegue de cliente en producción.",
    role: "Diseño y desarrollo web (demo / plantilla)",
    duration: "2026",
    client: "Proyecto propio (demo / plantilla)",
    sections: [
      {
        id: "contexto",
        title: "Contexto",
        blocks: [
          {
            type: "p",
            text: "El sector de la impresión y la copistería tiene un patrón común: catálogo de productos, configuración de un encargo (formato, acabados, cantidad) y solicitud de presupuesto. Esta demo modela ese flujo como plantilla reutilizable.",
          },
        ],
      },
      {
        id: "solucion",
        title: "La solución",
        blocks: [
          {
            type: "p",
            text: "Un sitio a medida con catálogo, tienda y un configurador de encargos que guía al usuario y termina en una solicitud de presupuesto clara. Diseño propio (no una plantilla genérica de mercado), rápido y cuidado en cada detalle, desplegado para cargar al instante.",
          },
        ],
      },
      {
        id: "resultado",
        title: "Resultado",
        blocks: [
          {
            type: "p",
            text: "Una base completa y reutilizable para una imprenta o copistería que quiera vender y recoger encargos online: del catálogo al presupuesto, lista para adaptar a un negocio concreto.",
          },
        ],
      },
    ],
  },
  trenchpass: {
    summary:
      "Gateway MCP en Rust: custodia de credenciales con doble factor Bearer+mTLS, auditoría append-only en Postgres y OTLP→SigNoz. Binario único, AGPL.",
    role: "Diseño y desarrollo de plataforma",
    duration: "En desarrollo (2026)",
    client: "Ecosistema Alexendros (proyecto propio)",
    sections: [
      {
        id: "contexto",
        title: "Contexto",
        blocks: [
          {
            type: "p",
            text: "Operar varios servicios y satélites implica integrar muchos proveedores externos. Cada uno con su token, su rotación y su lugar donde acaba guardado. El resultado natural es la dispersión: copias del mismo secreto en `.env`, en paneles de configuración y en la cabeza de quien lo configuró.",
          },
          {
            type: "p",
            text: "Cada copia es una superficie de ataque y un punto ciego: sin un registro central, no hay forma de responder a «quién accedió a esta credencial y cuándo».",
          },
        ],
      },
      {
        id: "reto",
        title: "El reto",
        blocks: [
          {
            type: "p",
            text: "El objetivo no era otro almacén de secretos más, sino un custodio único con gobernanza real: autenticación fuerte, auditoría incontrovertible y observabilidad, sin convertirse en un cuello de botella ni en un único punto de fallo silencioso.",
          },
          {
            type: "callout",
            text: "Decisión clave: exponer los secretos como tools del Model Context Protocol (MCP) tras un gateway en Rust, en lugar de repartir tokens. Los consumidores piden lo que necesitan; el gateway autentica, resuelve contra Vault y registra.",
          },
        ],
      },
      {
        id: "solucion",
        title: "La solución",
        blocks: [
          {
            type: "p",
            text: "TrenchPass se construye sobre axum y rmcp (Rust). El acceso exige doble factor simultáneo —certificado mTLS + Bearer token— con rate limiting y protección anti-replay. Los secretos viven en HashiCorp Vault (almacén caliente con caché de 60 s) y cada evento se escribe en una tabla append-only de PostgreSQL. La telemetría se exporta con OpenTelemetry a SigNoz.",
          },
          {
            type: "code",
            file: "ejemplo de acceso (conceptual)",
            code: `# El consumidor autentica con mTLS + Bearer y pide un secreto como tool MCP
POST /mcp  (cert mutuo + Authorization: Bearer <token>)
  tool: secrets.get
  args: { namespace: "stripe", key: "api_key" }
# → TrenchPass resuelve contra Vault, registra el acceso (append-only)
#   y exporta la traza a SigNoz`,
          },
          {
            type: "figure",
            label: "arquitectura TrenchPass",
            caption: "Consumidor (mTLS+Bearer) → TrenchPass → Vault (hot path) + PostgreSQL (audit) + SigNoz (telemetría)",
          },
        ],
      },
      {
        id: "resultado",
        title: "Estado y resultado",
        blocks: [
          {
            type: "p",
            text: "El scaffold compila y el enrutado de tools se construye namespace a namespace (~20 namespaces de credenciales planificados). Más que una métrica de adopción, TrenchPass es una afirmación de principios: la custodia de secretos se diseña, no se improvisa. Es open source bajo AGPL-3.0.",
          },
        ],
      },
    ],
  },
};

// Plantilla genérica coherente para proyectos sin estudio curado.
function genericStudy(p: Project): CaseStudy {
  return {
    summary: p.desc,
    role: "Diseño y desarrollo",
    duration: p.year,
    client: "Proyecto propio (open source)",
    sections: [
      {
        id: "contexto",
        title: "Contexto",
        blocks: [
          { type: "p", text: p.desc },
          {
            type: "p",
            text: `Proyecto de la categoría ${p.category} (${p.year}). Código y documentación públicos en el repositorio; el README detalla el problema, las decisiones de diseño y el alcance.`,
          },
        ],
      },
      {
        id: "resultado",
        title: "Resultado",
        blocks: [
          {
            type: "p",
            text: `Métricas destacadas: ${p.metrics.map((m) => `${m.v} ${m.l}`).join(", ")}.`,
          },
        ],
      },
    ],
  };
}

export function getCaseStudy(p: Project): CaseStudy {
  return STUDIES[p.id] ?? genericStudy(p);
}
