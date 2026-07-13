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
