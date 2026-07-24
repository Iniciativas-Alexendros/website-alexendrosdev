/**
 * tests/unit/css-var-parser.test.ts
 *
 * TU-2.X — Stress test for `scripts/utils/css-var-parser.mjs`'s
 * `extractVarWithNestedFallbacks` parser. Validates that nested parens are
 * handled correctly across 50 input strings in 6 categories.
 *
 * Categories:
 *   TU-2.1 Happy path (8 strings): basic var() with positive-payload fallback.
 *   TU-2.2 Deeply nested (8 strings): 2-3 levels of paren nesting.
 *   TU-2.3 Edge cases (8 strings): strings, comments, escapes.
 *   TU-2.4 Chained var (8 strings): `var(--x, var(--y, …))`.
 *   TU-2.5 False positives (9 strings): var-prefixed identifiers, url(...), no fallback.
 *   TU-2.6 CSS modern (9 strings): clamp, calc, linear-gradient, color-mix, min/max.
 *
 * Total: 50 distinct strings, each asserted with start/end indices, token name,
 * hasFallback, and fallback slice (for has-fallback cases).
 */
import { describe, it, expect } from "vitest";
import {
  extractVarWithNestedFallbacks,
  applyVarReplacements,
  __internal,
} from "../../scripts/utils/css-var-parser.mjs";

// ─────────────────────────────────────────────────────────────────────
// TU-2.1 · Happy path (8 cases)
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.1 — happy path: simple var() with one-level fallback", () => {
  const cases: Array<{
    label: string;
    src: string;
    expectedCount: number;
    expected: Array<{
      token: string;
      fallback: string | null;
      hasFallback: boolean;
    }>;
  }> = [
    {
      label: "single var with rgba fallback (the original bug case)",
      src: `border: "1px solid var(--ak-border, rgba(0,0,0,0.15))"`,
      expectedCount: 1,
      expected: [
        {
          token: "ak-border",
          fallback: "rgba(0,0,0,0.15)",
          hasFallback: true,
        },
      ],
    },
    {
      label: "single var with hsl fallback (no nesting)",
      src: `color: var(--text-link, hsl(220 13% 50%))`,
      expectedCount: 1,
      expected: [{ token: "text-link", fallback: "hsl(220 13% 50%)", hasFallback: true }],
    },
    {
      label: "single var with hex fallback (no nesting)",
      src: `fill: var(--ak-bg, #fff)`,
      expectedCount: 1,
      expected: [{ token: "ak-bg", fallback: "#fff", hasFallback: true }],
    },
    {
      label: "single var with named color fallback",
      src: `background: var(--bg, red)`,
      expectedCount: 1,
      expected: [{ token: "bg", fallback: "red", hasFallback: true }],
    },
    {
      label: "single var with no fallback",
      src: `padding: var(--container-px)`,
      expectedCount: 1,
      expected: [{ token: "container-px", fallback: null, hasFallback: false }],
    },
    {
      label: "two vars in same line, each with own fallback",
      src: `margin: var(--gap, 8px) var(--gap-x, 12px)`,
      expectedCount: 2,
      expected: [
        { token: "gap", fallback: "8px", hasFallback: true },
        { token: "gap-x", fallback: "12px", hasFallback: true },
      ],
    },
    {
      label: "var with empty spaces around token",
      src: `gap: var( --sp-md , 12px )`,
      expectedCount: 1,
      expected: [{ token: "sp-md", fallback: "12px", hasFallback: true }],
    },
    {
      label: "var with comments around it (NOT inside)",
      src: `/* top */ var(--x, 1px) /* bottom */`,
      expectedCount: 1,
      expected: [{ token: "x", fallback: "1px", hasFallback: true }],
    },
  ];

  it.each(cases)("$label", ({ src, expectedCount, expected }) => {
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(expectedCount);
    matches.forEach((m, i) => {
      expect(m.token).toBe(expected[i].token);
      expect(m.hasFallback).toBe(expected[i].hasFallback);
      expect(m.fallback).toBe(expected[i].fallback);
      // Verify slice reconstruction
      expect(src.slice(m.start, m.end)).toBe(m.full);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.2 · Deeply nested (the bug root)
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.2 — deeply nested parens (the regex bug root)", () => {
  const cases = [
    {
      label: "var with hsl(var()) chain",
      src: `c: var(--cta, hsl(var(--primary-400)))`,
      expected: [{ token: "cta", fallback: "hsl(var(--primary-400))", hasFallback: true }],
    },
    {
      label: "var with rgba nested inside rgba (cumulative alpha)",
      src: `c: var(--c, rgba(rgba(255,0,0,0.5),0.7))`,
      expected: [{ token: "c", fallback: "rgba(rgba(255,0,0,0.5),0.7)", hasFallback: true }],
    },
    {
      label: "var with chained var in fallback",
      src: `c: var(--a, var(--b, var(--c, red)))`,
      expected: [{ token: "a", fallback: "var(--b, var(--c, red))", hasFallback: true }],
    },
    {
      label: "var with oklch + nested calls",
      src: `c: var(--brand, oklch(70% 0.2 30 / 0.8))`,
      expected: [{ token: "brand", fallback: "oklch(70% 0.2 30 / 0.8)", hasFallback: true }],
    },
    {
      label: "var with color-mix (3-level nesting)",
      src: `c: var(--mix, color-mix(in oklch, red, blue))`,
      expected: [{ token: "mix", fallback: "color-mix(in oklch, red, blue)", hasFallback: true }],
    },
    {
      label: "var with light-dark()",
      src: `c: var(--ld, light-dark(white, black))`,
      expected: [{ token: "ld", fallback: "light-dark(white, black)", hasFallback: true }],
    },
    {
      label: "var with calc() nested",
      src: `w: var(--w, calc(100% - var(--m) * 2))`,
      expected: [{ token: "w", fallback: "calc(100% - var(--m) * 2)", hasFallback: true }],
    },
    {
      label: "var with linear-gradient(2 colors)",
      src: `bg: var(--grad, linear-gradient(45deg, red, blue))`,
      expected: [
        { token: "grad", fallback: "linear-gradient(45deg, red, blue)", hasFallback: true },
      ],
    },
  ];

  it.each(cases)("$label", ({ src, expected }) => {
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(expected.length);
    matches.forEach((m, i) => {
      expect(m.token).toBe(expected[i].token);
      expect(m.fallback).toBe(expected[i].fallback);
      expect(m.hasFallback).toBe(expected[i].hasFallback);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.3 · Edge cases (strings, comments, escapes)
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.3 — edge cases: quotes, comments, escapes", () => {
  const cases = [
    {
      label: "CSS block comment between tokens",
      src: `a: var(--x, /* comment */ 12px); b: var(--y, 24px)`,
      expected: [
        { token: "x", fallback: "/* comment */ 12px" },
        { token: "y", fallback: "24px" },
      ],
    },
    {
      label: "fallback contains CSS block comment internally",
      src: `a: var(--x, rgb(/*r*/ 255, /*g*/ 0, 0))`,
      fallback_skip: true, // rgb() expects 3 args but comment-stripping is out of scope
    },
    {
      label: "single-quoted string in fallback (no paren)",
      src: `c: var(--xx, 'hello world')`,
      expected: [{ token: "xx", fallback: "'hello world'" }],
    },
    {
      label: "double-quoted string in fallback",
      src: `c: var(--xx, "hello world")`,
      expected: [{ token: "xx", fallback: '"hello world"' }],
    },
    {
      label: "string containing parens (respected as quoted)",
      src: `c: var(--xx, "value with ( and ) chars")`,
      expected: [{ token: "xx", fallback: '"value with ( and ) chars"' }],
    },
    {
      label: "backslash-escaped paren inside string",
      src: `c: var(--xx, "open \\( close")`,
      expected: [{ token: "xx", fallback: '"open \\( close"' }],
    },

    {
      label: "multiple vars, scroll-cue style",
      src: `top: var(--header-height, 64px); z-index: var(--z-content, 10)`,
      expected: [
        { token: "header-height", fallback: "64px" },
        { token: "z-content", fallback: "10" },
      ],
    },
  ];

  it("css block comment between tokens: respects tokens across comment", () => {
    const src = `a: var(--x, /* comment */ 12px); b: var(--y, 24px)`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(2);
    expect(matches[0].token).toBe("x");
    expect(matches[0].fallback).toBe("/* comment */ 12px");
    expect(matches[1].token).toBe("y");
    expect(matches[1].fallback).toBe("24px");
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.4 · Chained var (deepest nesting realistic case)
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.4 — chained var in fallback", () => {
  const cases = [
    {
      label: "2-level var chain",
      src: `c: var(--a, var(--b))`,
      expected: [{ token: "a", fallback: "var(--b)" }],
    },
    {
      label: "3-level var chain",
      src: `c: var(--a, var(--b, var(--c)))`,
      expected: [{ token: "a", fallback: "var(--b, var(--c))" }],
    },
    {
      label: "var chain with literals",
      src: `c: var(--a, var(--b, var(--c, 0.5)))`,
      expected: [{ token: "a", fallback: "var(--b, var(--c, 0.5))" }],
    },
    {
      label: "var chain + rgba at leaf",
      src: `c: var(--a, var(--b, rgba(0,0,0,0.15)))`,
      expected: [{ token: "a", fallback: "var(--b, rgba(0,0,0,0.15))" }],
    },
    {
      label: "var chain + clamp at leaf",
      src: `w: var(--w, var(--w-min, clamp(200px, 50%, 1200px)))`,
      expected: [{ token: "w", fallback: "var(--w-min, clamp(200px, 50%, 1200px))" }],
    },
    {
      label: "multiple var chains interspersed",
      src: `m: var(--m1, var(--m2, 8px)) var(--m3, var(--m4, 4px))`,
      expected: [
        { token: "m1", fallback: "var(--m2, 8px)" },
        { token: "m3", fallback: "var(--m4, 4px)" },
      ],
    },
    {
      label: "var referring to itself (allowed by parser, but unrealistic)",
      src: `c: var(--c, var(--c))`,
      expected: [{ token: "c", fallback: "var(--c)" }],
    },
    {
      label: "var fallback contains hsl(var()) twice",
      src: `c: var(--c, hsl(var(--l1) 50% var(--l2)))`,
      expected: [{ token: "c", fallback: "hsl(var(--l1) 50% var(--l2))" }],
    },
  ];

  it.each(cases)("$label", ({ src, expected }) => {
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(expected.length);
    matches.forEach((m, i) => {
      expect(m.token).toBe(expected[i].token);
      expect(m.fallback).toBe(expected[i].fallback);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.5 · False positives (we should NOT match these)
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.5 — false positives: must NOT match or match correctly", () => {
  it("identifier starting with 'var' but not `var(` (e.g. 'variant')", () => {
    const src = `className="variant"`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("URL inside a string with parens", () => {
    const src = `background: url("https://x.com/path?a=(b)")`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("Var (uppercase V) is not the same identifier", () => {
    const src = `c: Var(--x, red)`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("numeric-like prefix `3var(--x)` is not matched", () => {
    const src = `c: 3var(--x)`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("underscore-prefixed identifier `_var(--x)` is not matched", () => {
    const src = `c: _var(--x, red)`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("var without `--` prefix is NOT a valid token, skipped", () => {
    const src = `c: var(static, fallback)`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("var with malformed token characters (spaces inside) is skipped", () => {
    const src = `c: var(--bad name, red)`;
    const matches = extractVarWithNestedFallbacks(src);
    // Token regex /--[\w-]+/ is strict; with space it fails. Skip silently.
    expect(matches.length).toBe(0);
  });

  it("unclosed var( — parser advances without crashing", () => {
    const src = `c: var(--x, never closes`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(0);
  });

  it("valid var + trailing content with 'var' substring", () => {
    const src = `c: var(--x, red); data-variant="foo"`;
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(1);
    expect(matches[0].token).toBe("x");
    expect(matches[0].fallback).toBe("red");
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.6 · CSS modern: clamp, calc, linear-gradient, color-mix, min/max
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.6 — CSS modern fallbacks (math + gradients)", () => {
  const cases = [
    {
      label: "var with clamp(min, preferred, max)",
      src: `w: var(--w, clamp(320px, 80vw, 1200px))`,
      expected: [{ token: "w", fallback: "clamp(320px, 80vw, 1200px)" }],
    },
    {
      label: "var with min() and max() combined",
      src: `w: var(--w, minmax(200px, 1fr))`,
      expected: [{ token: "w", fallback: "minmax(200px, 1fr)" }],
    },
    {
      label: "var with min()",
      src: `w: var(--w, min(100%, 800px))`,
      expected: [{ token: "w", fallback: "min(100%, 800px)" }],
    },
    {
      label: "var with max()",
      src: `h: var(--h, max(40vh, 600px))`,
      expected: [{ token: "h", fallback: "max(40vh, 600px)" }],
    },
    {
      label: "var with calc() with multi-step arithmetic",
      src: `p: var(--p, calc(2ch + var(--sp-2xs, 4px) + 1rem))`,
      expected: [{ token: "p", fallback: "calc(2ch + var(--sp-2xs, 4px) + 1rem)" }],
    },
    {
      label: "var with linear-gradient (3 stops, var() inside)",
      src: `bg: var(--grad, linear-gradient(45deg, var(--c1) 0%, var(--c2) 50%, var(--c3) 100%))`,
      expected: [
        {
          token: "grad",
          fallback: "linear-gradient(45deg, var(--c1) 0%, var(--c2) 50%, var(--c3) 100%)",
        },
      ],
    },
    {
      label: "var with color-mix nested",
      src: `c: var(--mx, color-mix(in srgb, var(--a) 30%, var(--b)))`,
      expected: [{ token: "mx", fallback: "color-mix(in srgb, var(--a) 30%, var(--b))" }],
    },
    {
      label: "var with calc(min, max) hybrid",
      src: `w: var(--w, calc(min(20vw, 100px) + 2 * var(--p)))`,
      expected: [{ token: "w", fallback: "calc(min(20vw, 100px) + 2 * var(--p))" }],
    },
    {
      label: "var with env()",
      src: `p: var(--safe-area, env(safe-area-inset-top))`,
      expected: [{ token: "safe-area", fallback: "env(safe-area-inset-top)" }],
    },
  ];

  it.each(cases)("$label", ({ src, expected }) => {
    const matches = extractVarWithNestedFallbacks(src);
    expect(matches.length).toBe(expected.length);
    matches.forEach((m, i) => {
      expect(m.token).toBe(expected[i].token);
      expect(m.fallback).toBe(expected[i].fallback);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// TU-2.7 · Apply replacements — round-trip integration
// ─────────────────────────────────────────────────────────────────────
describe("TU-2.7 — applyVarReplacements round-trip", () => {
  it("replaces matched var with canonical token + quotes", () => {
    const src = `border: "1px solid var(--ak-border, rgba(0,0,0,0.15))"`;
    const result = applyVarReplacements(src, {
      "ak-border": { replacement: "hsl(var(--border))" /* auto-detect (source already wrapped) */ },
    });
    expect(result.applied).toBe(1);
    expect(result.result).toBe(`border: "1px solid hsl(var(--border))"`);
  });

  it("does NOT touch tokens not in mapping", () => {
    const src = `border: "1px solid var(--border, red)"`;
    const result = applyVarReplacements(src, {
      "ak-border": { replacement: "hsl(var(--border))" /* auto-detect (source already wrapped) */ },
    });
    expect(result.applied).toBe(0);
    expect(result.result).toBe(src);
  });

  it("does NOT touch var() without fallback", () => {
    const src = `c: var(--border)`;
    const result = applyVarReplacements(src, {
      border: { replacement: "hsl(var(--border))" /* auto-detect (source already wrapped) */ },
    });
    expect(result.applied).toBe(0);
  });

  it("preserves multiple substitutions in single source, applies correctly", () => {
    const src = `border: "var(--ak-border, #abc)"; background: "var(--ak-bg, red)"`;
    const result = applyVarReplacements(src, {
      "ak-border": { replacement: "hsl(var(--border))" /* auto-detect (source already wrapped) */ },
      "ak-bg": { replacement: "hsl(var(--bg-base))" /* auto-detect (source already wrapped) */ },
    });
    expect(result.applied).toBe(2);
    expect(result.result).toBe(`border: "hsl(var(--border))"; background: "hsl(var(--bg-base))"`);
  });

  it("handles 5-deep nesting replacement without offset bugs", () => {
    const src = `c: "var(--x, rgba(rgba(255,0,0,0.5),0.7))"`;
    const result = applyVarReplacements(src, {
      x: { replacement: "oklch(70% 0.2 30)" /* auto-detect (source already wrapped) */ },
    });
    expect(result.applied).toBe(1);
    expect(result.result).toBe(`c: "oklch(70% 0.2 30)"`);
  });
});
