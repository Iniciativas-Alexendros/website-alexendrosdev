#!/usr/bin/env node
/**
 * detect-new-liveurls.mjs
 *
 * Reads the git diff between two refs for `src/lib/content/projects.ts`
 * and outputs a JSON array of `{slug, url}` pairs for any newly added `liveUrl` fields.
 *
 * Usage (CI):
 *   node scripts/detect-new-liveurls.mjs --base=<SHA> --head=<SHA>
 *
 * Usage (local):
 *   node scripts/detect-new-liveurls.mjs --base=origin/main --head=HEAD
 *
 * Output:
 *   JSON array to stdout: [{slug, url}, ...]  (empty array if none found)
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const BASE_FLAG = args.find((a) => a.startsWith("--base="));
const HEAD_FLAG = args.find((a) => a.startsWith("--head="));
const BASE = BASE_FLAG ? BASE_FLAG.split("=")[1] : "origin/main";
const HEAD = HEAD_FLAG ? HEAD_FLAG.split("=")[1] : "HEAD";

function runGit(cmd) {
  return execSync(cmd, { encoding: "utf-8", maxBuffer: 16 * 1024 });
}

function getDiff() {
  try {
    return runGit(`git diff "${BASE}"..."${HEAD}" -- src/lib/content/projects.ts`);
  } catch {
    // If the refs don't exist locally (CI shallow clone), try fetching first
    try {
      runGit(`git fetch origin "${BASE}" --depth=50 2>/dev/null || true`);
      return runGit(`git diff "${BASE}"..."${HEAD}" -- src/lib/content/projects.ts`);
    } catch {
      return "";
    }
  }
}

/**
 * Parse a unified git diff and extract {slug, url} pairs for added liveUrl lines.
 * Handles full project blocks where we need to find the nearest id: before liveUrl:.
 */
function parseNewLiveUrls(diff) {
  if (!diff.trim()) return [];

  const results = [];
  const lines = diff.split("\n");
  const added = []; // lines starting with +

  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      added.push(line.slice(1)); // strip the leading +
    }
  }

  // Scan for liveUrl additions and look backward for the enclosing id
  for (let i = 0; i < added.length; i++) {
    const line = added[i];
    const liveMatch = line.match(/^\s*liveUrl:\s*"([^"]+)"/);
    if (!liveMatch) continue;

    const url = liveMatch[1];

    // Walk backward from i to find the nearest id: field
    let slug = null;
    for (let j = i - 1; j >= Math.max(0, i - 25); j--) {
      const idMatch = added[j].match(/^\s*id:\s*"([^"]+)"/);
      if (idMatch) {
        slug = idMatch[1];
        break;
      }
    }

    if (slug && url) {
      // Avoid duplicates (multiple diff hunks could mention the same project)
      if (!results.some((r) => r.slug === slug)) {
        results.push({ slug, url });
      }
    }
  }

  return results;
}

function main() {
  const diff = getDiff();
  const newUrls = parseNewLiveUrls(diff);
  process.stdout.write(JSON.stringify(newUrls));
}

main();
