/**
 * ARCTIC OCEAN Design Tokens — typed constants.
 * Source of truth: src/styles/design-tokens.css (CSS vars) and src/tokens/tokens.json (DTCG).
 *
 * Use `oklch(var(--token-name))` in CSS or `oklch(L C H)` in JS.
 */

// ─── Color tokens ───────────────────────────────────────────────────────────
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
  cta: [214, 50, 35] as const,
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
  body: "1rem",
  small: "0.875rem",
  caption: "0.75rem",
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const space = {
  1: "0.25rem" /* 4px */,
  2: "0.5rem" /* 8px */,
  3: "0.75rem" /* 12px */,
  4: "1rem" /* 16px */,
  5: "1.25rem" /* 20px */,
  6: "1.5rem" /* 24px */,
  7: "1.75rem" /* 28px */,
  8: "2rem" /* 32px */,
  9: "2.25rem" /* 36px */,
  10: "2.5rem" /* 40px */,
  11: "2.75rem" /* 44px */,
  12: "3rem" /* 48px */,
  13: "3.25rem" /* 52px */,
  14: "3.5rem" /* 56px */,
  15: "3.75rem" /* 60px */,
  16: "4rem" /* 64px */,
  17: "4.25rem" /* 68px */,
  18: "4.5rem" /* 72px */,
  19: "4.75rem" /* 76px */,
  20: "5rem" /* 80px */,
  21: "5.25rem" /* 84px */,
  22: "5.5rem" /* 88px */,
  23: "5.75rem" /* 92px */,
  24: "6rem" /* 96px */,
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
  sm: "0 1px 2px oklch(0.2612 0.0280 253.8 / 0.05)",
  md: "0 4px 12px oklch(0.2612 0.0280 253.8 / 0.08)",
  lg: "0 12px 40px oklch(0.2612 0.0280 253.8 / 0.12)",
  xl: "0 24px 60px oklch(0.2612 0.0280 253.8 / 0.16)",
  focus: "0 0 0 3px oklch(0.5451 0.0927 255.6 / 0.3)",
} as const;

// ─── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  containerMax: "1120px",
} as const;

// ─── Shared component types ───────────────────────────────────────────────

export type Variant = "primary" | "secondary" | "ghost" | "outline";
export type Size = "sm" | "md" | "lg";
export type State =
  "idle" | "hover" | "active" | "focus" | "disabled" | "loading" | "error" | "empty";
export type Orientation = "horizontal" | "vertical";
export type Side = "top" | "right" | "bottom" | "left" | "start" | "end";

export type TokenGroup = typeof colors;
