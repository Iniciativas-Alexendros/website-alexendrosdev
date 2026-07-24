#!/usr/bin/env node
/**
 * scripts/utils/css-var-parser.mjs
 *
 * CSS `var(--token[, fallback])` parser with full support for nested parens,
 * escaped chars, single/double-quoted strings, and CSS block comments.
 *
 * Why this exists: the original `fix-token-coverage.mjs` regex
 *   `(?:[^()]|\([^()]*\))*`
 * maxes out at 1 level of nesting; any fallback containing a balanced call
 * with ≥2 nesting levels (e.g. `clamp(min, calc(1+var(--x)), max)`,
 * `var(--c, linear-gradient(45deg, var(--a), var(--b)))`) silently misses the
 * whole occurrence, with the script returning exit 0 (false OK).
 *
 * This parser is a single-pass linear scanner that tracks paren depth plus
 * three mutually-exclusive states (single-quoted, double-quoted, CSS comment)
 * plus a single-char escape mechanism.  Algorithm runs in O(n) on input length.
 *
 * Public API:
 *   extractVarWithNestedFallbacks(src: string): Array<VarMatch>
 *   where VarMatch = { start, end, full, token, fallback, hasFallback }
 *
 * Behavior / contract:
 *   - Returns matches in left-to-right source order.
 *   - `start` is the index of the leading `v` of `var(`. `end` is the index
 *     AFTER the matching `)`. So `src.slice(start, end)` reconstructs the
 *     full `var(...)` substring verbatim.
 *   - `token` is the bare token name WITHOUT the `--` prefix.
 *   - `fallback` is the raw fallback string WITHOUT surrounding whitespace.
 *     `null` when the var has no fallback.
 *   - Strict mode parsing: token MUST match `/^--[\w-]+$/`. Otherwise the
 *     occurrence is skipped (e.g. `var(static)`).
 *   - If `var(` has no matching `)`, the scanner advances past this candidate.
 *   - `var` must NOT be part of a larger identifier — boundary check ensures
 *     we skip `(my-var(x))`, `somevar(--x)`, `Var(--x)` (case-sensitive).
 *
 * Not handled (documented limits):
 *   - Comments inside `url()`, `attr()`, or `var()` declared functions are
 *     handled. Other potentially weird states (e.g. within at-rules) pass
 *     through unmodified — we treat the entire input as a flat code stream.
 *   - Hex escapes in strings (`\2c`) are not specially handled; we just
 *     consume the escaped char and continue. CSS strings rarely need this.
 *   - Unicode escapes `\NNNN` are similarly consumed as 1 escape pair.
 */

const isIdentChar = (c) => /[a-zA-Z0-9_-]/.test(c);

/**
 * Find the index of the `)` that matches the `(` at openIdx.
 * Returns -1 if no match found (e.g. truncated input).
 *
 * @param {string} src
 * @param {number} openIdx - index where `(` lives; scanning starts at openIdx+1
 * @returns {number}
 */
function findMatchingParen(src, openIdx) {
  if (src[openIdx] !== "(") return -1;
  let depth = 1;
  let i = openIdx + 1;
  const len = src.length;
  let inSingle = false;
  let inDouble = false;
  let inComment = false;

  while (i < len) {
    const c = src[i];

    // Inside block comment — wait for `*/`
    if (inComment) {
      if (c === "*" && src[i + 1] === "/") {
        inComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Inside single-quoted string
    if (inSingle) {
      if (c === "\\" && i + 1 < len) {
        i += 2; // escape: consume next char as literal
        continue;
      }
      if (c === "'") inSingle = false;
      i++;
      continue;
    }

    // Inside double-quoted string
    if (inDouble) {
      if (c === "\\" && i + 1 < len) {
        i += 2;
        continue;
      }
      if (c === '"') inDouble = false;
      i++;
      continue;
    }

    // Neutral state
    if (c === "/" && src[i + 1] === "*") {
      inComment = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      i++;
      continue;
    }
    if (c === "\\" && i + 1 < len) {
      i += 2; // generic backslash escape (e.g. parentheses inside url())
      continue;
    }
    if (c === "(") {
      depth++;
      i++;
      continue;
    }
    if (c === ")") {
      depth--;
      if (depth === 0) return i;
      i++;
      continue;
    }
    i++;
  }

  return -1; // unclosed
}

/**
 * Parse the contents between `(` and `)` of a `var()` call.
 * Returns `null` if the contents are not a valid `--token [, fallback]`.
 *
 * @param {string} contents
 * @returns {{ token: string, fallback: string | null } | null}
 */
function parseVarContents(contents) {
  const trimmed = contents.trimStart();
  if (!trimmed.startsWith("--")) return null;

  // Find first comma at depth 0 (respect quotes/comments).
  let depth = 0;
  let commaIdx = -1;
  let inS = false;
  let inD = false;
  let inC = false;

  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (inC) {
      if (c === "*" && trimmed[i + 1] === "/") {
        inC = false;
        i++;
      }
      continue;
    }
    if (inS) {
      if (c === "\\" && i + 1 < trimmed.length) {
        i++;
        continue;
      }
      if (c === "'") inS = false;
      continue;
    }
    if (inD) {
      if (c === "\\" && i + 1 < trimmed.length) {
        i++;
        continue;
      }
      if (c === '"') inD = false;
      continue;
    }
    if (c === "/" && trimmed[i + 1] === "*") {
      inC = true;
      i++;
      continue;
    }
    if (c === "'") {
      inS = true;
      continue;
    }
    if (c === '"') {
      inD = true;
      continue;
    }
    if (c === "(") {
      depth++;
      continue;
    }
    if (c === ")") {
      depth--;
      continue;
    }
    if (c === "," && depth === 0) {
      commaIdx = i;
      break;
    }
  }

  if (commaIdx === -1) {
    // No fallback; entire contents is the token.
    const tokenFull = trimmed.trimEnd();
    if (!/^--[\w-]+$/.test(tokenFull)) return null;
    return { token: tokenFull.slice(2), fallback: null, hasFallback: false };
  }

  const tokenFull = trimmed.slice(0, commaIdx).trimEnd();
  const fallbackRaw = trimmed.slice(commaIdx + 1).trim();
  if (!/^--[\w-]+$/.test(tokenFull)) return null;
  return { token: tokenFull.slice(2), fallback: fallbackRaw, hasFallback: true };
}

/**
 * Scan a source string for all `var(...)` expressions.
 * Returns Match[] in source order.
 *
 * @param {string} src
 * @returns {Array<{ start: number, end: number, full: string, token: string,
 *                  fallback: string|null, hasFallback: boolean }>}
 */
export function extractVarWithNestedFallbacks(src) {
  const results = [];
  const len = src.length;
  let i = 0;

  while (i < len) {
    // Detect `var(` literal — case-sensitive lowercase.
    if (src[i] === "v" && src[i + 1] === "a" && src[i + 2] === "r" && src[i + 3] === "(") {
      // Boundary check: must NOT be preceded by an identifier char.
      if (i > 0 && isIdentChar(src[i - 1])) {
        i++;
        continue;
      }
      const closeIdx = findMatchingParen(src, i + 3);
      if (closeIdx === -1) {
        // Malformed — advance past this `var(`.
        i = i + 4;
        continue;
      }
      const contents = src.slice(i + 4, closeIdx);
      const parsed = parseVarContents(contents);
      if (parsed) {
        results.push({
          start: i,
          end: closeIdx + 1,
          full: src.slice(i, closeIdx + 1),
          token: parsed.token,
          fallback: parsed.fallback,
          hasFallback: parsed.hasFallback,
        });
      }
      i = closeIdx + 1;
      continue;
    }
    i++;
  }

  return results;
}

/**
 * Apply replacements to `src` for matches whose token is in `mapping`.
 * mapping = { [tokenName]: { replacement: string, wrapInQuotes?: boolean } }
 *
 * Quote wrap handling (auto-detect by default — preserving original wrapping):
 *   - If `wrapInQuotes === true`: force `"<replacement>"` wrapping, even if
 *     the original `var(...)` was unwrapped (CSS context).
 *   - If `wrapInQuotes === false`: force unwrapped, even if original was
 *     wrapped in `"..."` (inline JSX string).
 *   - If `wrapInQuotes === null | undefined` (default): auto-detect. If the
 *     match is preceded by `"` AND followed by `"`, preserve those quotes
 *     (the replacement is just the value, and surrounding context stays
 *     intact). Otherwise leave the value unwrapped.
 *
 * Operates on string indices, working backwards to keep offsets valid.
 *
 * @param {string} src
 * @param {Record<string, { replacement: string, wrapInQuotes?: boolean | null }>} mapping
 * @returns {{ result: string, applied: number, occurrences: Array } }
 */
export function applyVarReplacements(src, mapping) {
  const matches = extractVarWithNestedFallbacks(src);
  // Work backwards through matches so offsets remain valid.
  let result = src;
  let applied = 0;
  const occurrences = [];

  for (let idx = matches.length - 1; idx >= 0; idx--) {
    const m = matches[idx];
    const config = mapping[m.token];
    if (!config) continue; // token not in mapping → skip silently
    if (!m.hasFallback) continue; // no fallback in source → not a "fix" target

    const { start, end, full } = m;

    // Determine whether to wrap replacement in `"..."`.
    let newStr;
    if (config.wrapInQuotes === true) {
      newStr = `"${config.replacement}"`;
    } else if (config.wrapInQuotes === false) {
      newStr = config.replacement;
    } else {
      // Auto-detect: preserve surrounding quotes if present.
      const wrappedInQuotes = src[start - 1] === '"' && src[end] === '"';
      newStr = config.replacement; // surrounding quotes stay via slice()
      void wrappedInQuotes; // referenced for clarity; behavior is implicit in slice()
    }

    result = result.slice(0, start) + newStr + result.slice(end);
    occurrences.push({
      token: m.token,
      original: full,
      replacement: newStr,
      offset: start,
    });
    applied++;
  }

  // Restore source order (we accumulated backwards).
  occurrences.reverse();
  return { result, applied, occurrences };
}

// Re-export internals for advanced testing / extension.
export const __internal = { findMatchingParen, parseVarContents, isIdentChar };
