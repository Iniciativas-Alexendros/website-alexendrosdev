/**
 * ARCTIC OCEAN Design Tokens — typed constants.
 * Source of truth: src/styles/design-tokens.css (CSS vars) and src/tokens/tokens.json (DTCG).
 *
 * HSL channels are provided as [h, s%, l%] tuples for dynamic color manipulation.
 * Use `hsl(var(--token-name))` in CSS or `hsl(h, s%, l%)` in JS.
 */

// ─── Color tokens (HSL channels) ────────────────────────────────────────────
// Light mode defaults. Dark mode overrides in .dark class via CSS.

export const colors = {
  primary: {
    50: [213, 60, 95] as const,
    100: [213, 72, 90] as const,
    200: [213, 60, 80] as const,
    300: [213, 58, 70] as const,
    400: [214, 50, 35] as const,
    500: [214, 45, 28] as const,
    600: [214, 50, 22] as const,
    700: [214, 55, 18] as const,
    800: [214, 60, 14] as const,
    900: [214, 70, 10] as const,
    950: [214, 75, 6] as const,
  },
  surface: {
    bg: [210, 20, 98] as const,
    elevated: [0, 0, 100] as const,
    sunken: [210, 20, 96] as const,
    highlight: [213, 72, 90] as const,
    inset: [210, 18, 93] as const,
  },
  text: {
    primary: [213, 30, 15] as const,
    secondary: [215, 16, 30] as const,
    tertiary: [213, 20, 28] as const,
    muted: [213, 18, 38] as const,
    onPrimary: [0, 0, 100] as const,
    link: [214, 45, 32] as const,
    linkHover: [214, 50, 28] as const,
  },
  semantic: {
    success: [180, 55, 28] as const,
    warning: [42, 40, 56] as const,
    emergency: [3, 37, 52] as const,
    info: [214, 38, 47] as const,
  },
  border: {
    default: [210, 20, 82] as const,
    subtle: [210, 25, 93] as const,
    focus: [214, 38, 47] as const,
  },
  terminal: {
    bg: [210, 18, 93] as const,
    text: [213, 30, 15] as const,
    prompt: [214, 38, 47] as const,
    cursor: [214, 38, 47] as const,
    comment: [210, 18, 38] as const,
    keyword: [214, 45, 34] as const,
    string: [150, 28, 28] as const,
  },
} as const;

export type HslChannel = readonly [number, number, number];

// ─── Typography ─────────────────────────────────────────────────────────────

export const font = {
  sans: `var(--font-geist), 'Geist', system-ui, -apple-system, sans-serif`,
  mono: `var(--font-geist-mono), 'Geist Mono', ui-monospace, 'SF Mono', monospace`,
  code: `var(--font-jetbrains), 'JetBrains Mono', ui-monospace, 'SF Mono', monospace`,
} as const;

// ─── Font sizes ─────────────────────────────────────────────────────────────

export const fontSize = {
  display: "clamp(2.5rem, 5vw, 4rem)",
  h1: "clamp(2rem, 4vw, 3rem)",
  h2: "clamp(1.5rem, 3vw, 2.25rem)",
  h3: "1.25rem",
  h4: "1.125rem",
  bodyLg: "1.125rem",
  body: "1rem",
  bodySm: "0.875rem",
  caption: "0.75rem",
  monoSm: "0.8125rem",
  monoLg: "0.9375rem",
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const space = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

// ─── Border radius ─────────────────────────────────────────────────────────

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  full: "9999px",
  interactive: "9999px",
} as const;

// ─── Motion ─────────────────────────────────────────────────────────────────

export const duration = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
} as const;

export const easing = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** Easing values as numeric arrays for JS animations (framer-motion, etc.) */
export const easingValues = {
  default: [0.4, 0, 0.2, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

// ─── Shadows ────────────────────────────────────────────────────────────────

export const shadow = {
  sm: `0 1px 2px ${hslWithOpacity(colors.text.primary, 0.05)}`,
  md: `0 4px 12px ${hslWithOpacity(colors.text.primary, 0.08)}`,
  lg: `0 12px 40px ${hslWithOpacity(colors.text.primary, 0.12)}`,
  xl: `0 24px 60px ${hslWithOpacity(colors.text.primary, 0.16)}`,
  focus: `0 0 0 3px ${hslWithOpacity(colors.border.focus, 0.3)}`,
} as const;

// ─── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  containerMax: "1280px",
} as const;

// ─── Helper: convert HSL channel tuple to CSS hsl() string ─────────────────

export function hsl(channel: HslChannel): string {
  return `hsl(${channel[0]} ${channel[1]}% ${channel[2]}%)`;
}

// ─── Helper: convert HSL channel tuple to CSS hsl() with opacity ───────────

export function hslWithOpacity(channel: HslChannel, opacity: number): string {
  return `hsl(${channel[0]} ${channel[1]}% ${channel[2]}% / ${opacity})`;
}

// ─── Shared component types ───────────────────────────────────────────────

export type Variant = "primary" | "secondary" | "ghost" | "outline";
export type Size = "sm" | "md" | "lg";
export type State =
  "idle" | "hover" | "active" | "focus" | "disabled" | "loading" | "error" | "empty";
export type Orientation = "horizontal" | "vertical";
export type Side = "top" | "right" | "bottom" | "left" | "start" | "end";

export type TokenGroup = typeof colors;
