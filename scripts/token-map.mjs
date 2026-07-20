/**
 * token-map.mjs — Shared mapping between CSS variable names and DTCG paths.
 *
 * Single source of truth for the 37 color tokens + 4 shadow tokens.
 * Imported by validate-tokens.mjs and sync-hex-from-css.mjs.
 */

/** Maps CSS --var-name → DTCG dotted path. null = explicitly skipped (shadows). */
export const CSS_TO_DTCG_MAP = {
  // Primary
  "primary-50": "color.primary.50",
  "primary-100": "color.primary.100",
  "primary-200": "color.primary.200",
  "primary-300": "color.primary.300",
  "primary-400": "color.primary.400",
  "primary-500": "color.primary.500",
  "primary-600": "color.primary.600",
  "primary-700": "color.primary.700",
  "primary-800": "color.primary.800",
  "primary-900": "color.primary.900",
  "primary-950": "color.primary.950",
  // Surfaces
  "bg-base": "color.surface.background",
  "bg-elevated": "color.surface.elevated",
  "bg-sunken": "color.surface.sunken",
  "bg-highlight": "color.surface.highlight",
  "bg-inset": "color.surface.inset",
  // Text
  "text-primary": "color.text.primary",
  "text-secondary": "color.text.secondary",
  "text-tertiary": "color.text.tertiary",
  "text-muted": "color.text.muted",
  "text-on-primary": "color.text.on-primary",
  "text-link": "color.text.link",
  "text-link-hover": "color.text.link-hover",
  // Semantic
  success: "color.semantic.success",
  warning: "color.semantic.warning",
  emergency: "color.semantic.emergency",
  info: "color.semantic.info",
  // Borders
  border: "color.border.default",
  "border-subtle": "color.border.subtle",
  "border-focus": "color.border.focus",
  // Terminal
  "terminal-bg": "color.terminal.bg",
  "terminal-text": "color.terminal.text",
  "terminal-prompt": "color.terminal.prompt",
  "terminal-cursor": "color.terminal.cursor",
  "terminal-comment": "color.terminal.comment",
  "terminal-keyword": "color.terminal.keyword",
  "terminal-string": "color.terminal.string",
  // Shadows (opacity varies, skip hex check for shadows)
  "shadow-sm": null,
  "shadow-md": null,
  "shadow-lg": null,
  "shadow-xl": null,
};

/** Derived dark-mode mapping (prefixes every non-null path with "dark."). */
export const DARK_CSS_TO_DTCG_MAP = {};
for (const [cssVar, dtcgPath] of Object.entries(CSS_TO_DTCG_MAP)) {
  if (dtcgPath) DARK_CSS_TO_DTCG_MAP[cssVar] = "dark." + dtcgPath;
}

/** Returns the set of CSS var names that have a valid (non-null) DTCG mapping. */
export function getColorVars() {
  return new Set(Object.keys(CSS_TO_DTCG_MAP).filter((k) => CSS_TO_DTCG_MAP[k]));
}

/** Returns the list of DTCG paths that have a valid mapping (non-null). */
export function getDTCGPaths() {
  return Object.keys(CSS_TO_DTCG_MAP)
    .filter((k) => CSS_TO_DTCG_MAP[k])
    .map((k) => CSS_TO_DTCG_MAP[k]);
}
