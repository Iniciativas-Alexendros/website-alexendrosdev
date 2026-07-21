/**
 * Project image resolution: real screenshots for projects with live URLs,
 * CSS gradient tokens for internal tools without public UI.
 *
 * Also provides section-specific gradient styles for case-study figure blocks
 * so each section of a project detail gets a distinct visual palette.
 */

// Projects with real captured screenshots
// Auto-captured via scripts/capture-project-screenshots.mjs
const REAL_IMAGES: Record<string, string> = {
  "alexendros-me": "/images/projects/alexendros-me/hero.webp",
  nasve: "/images/projects/nasve/hero.webp",
  "pipeline-crm": "/images/projects/pipeline-crm/hero.webp",
  "stripe-catalog": "/images/projects/stripe-catalog/hero.webp",
  "mcp-toolkit": "/images/projects/mcp-toolkit/hero.webp",
};

// Gradient fallbacks for internal tools without deployable UIs.
// Add entries here when adding projects that have no liveUrl and no
// capturable UI: the gradient uses OKLCH tokens from the design system.
// stripe-catalog and mcp-toolkit were migrated to real screenshots.
const GRADIENT_FALLBACKS: Record<string, string> = {};

/**
 * Section → gradient token mapping for case-study figure blocks.
 * Each section type gets a distinct OKLCH palette so the visual
 * narrative shifts as the reader moves through the case study.
 */
const SECTION_GRADIENTS: Record<string, string> = {
  contexto:
    "linear-gradient(135deg, oklch(var(--primary-300) / 0.6), oklch(var(--primary-600) / 0.8))",
  solucion: "linear-gradient(135deg, oklch(var(--success) / 0.5), oklch(var(--primary-400) / 0.7))",
  resultado:
    "linear-gradient(135deg, oklch(var(--primary-400) / 0.6), oklch(var(--warning) / 0.5))",
};

const DEFAULT_SECTION_GRADIENT =
  "linear-gradient(135deg, oklch(var(--primary-200) / 0.5), oklch(var(--primary-500) / 0.7))";

export function getProjectImageOrGradient(
  id: string,
): { type: "image"; src: string } | { type: "gradient"; style: string } {
  if (REAL_IMAGES[id]) return { type: "image", src: REAL_IMAGES[id] };
  if (GRADIENT_FALLBACKS[id]) return { type: "gradient", style: GRADIENT_FALLBACKS[id] };
  return {
    type: "gradient",
    style: "linear-gradient(135deg, oklch(var(--bg-sunken)), oklch(var(--bg-elevated)))",
  };
}

/**
 * Returns a gradient `background` value for a case-study section figure block.
 * Each section ID maps to a distinct OKLCH token pair so figures
 * visually differentiate the narrative arc.
 *
 * @param sectionId — the case-study section ID (e.g. "contexto", "solucion", "resultado")
 * @returns CSS `background` value using design-token channels
 */
export function getSectionGradient(sectionId: string): string {
  return SECTION_GRADIENTS[sectionId] ?? DEFAULT_SECTION_GRADIENT;
}
