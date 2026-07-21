/**
 * Project image resolution: real screenshots for projects with live URLs,
 * CSS gradient tokens for internal tools without public UI.
 */

// Projects with real captured screenshots
const REAL_IMAGES: Record<string, string> = {
  "alexendros-me": "/images/projects/alexendros-me/hero.png",
  nasve: "/images/projects/nasve/hero.png",
};

// Gradient fallbacks for internal tools (OKLCH tokens)
const GRADIENT_FALLBACKS: Record<string, string> = {
  "pipeline-crm": "linear-gradient(135deg, oklch(var(--primary-400)), oklch(var(--success)))",
  "stripe-catalog": "linear-gradient(135deg, oklch(var(--accent)), oklch(var(--primary-400)))",
  "mcp-toolkit": "linear-gradient(135deg, oklch(var(--info)), oklch(var(--primary-400)))",
};

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
