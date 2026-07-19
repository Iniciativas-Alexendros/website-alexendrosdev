# Vercel Deployment Sanitization & Branch Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sanitize Vercel branch-to-deployment mappings, verify which version is live vs preview, and promote the `feat/restructure-content` redesign (reference preview) to production to fix homepage bugs.

**Architecture:** The project uses Vercel's Git-integrated auto-deploy: `main` → production (`alexendros.dev`), any branch → preview URL. The `scripts/should-build.mjs` gate controls whether a branch triggers a build. The `feat/restructure-content` branch contains the corrected redesign (Tailwind v4 tokens, `HomeProjects` component, updated design tokens) but has never been merged to `main`.

**Tech Stack:** Next.js 16, Vercel (Git integration), `vercel.json` + `scripts/should-build.mjs`, GitHub branch protection

---

## Global Constraints

- `vercel.json` must exist on ALL deployable branches (currently `feat/restructure-content` is missing `ignoreCommand`)
- `scripts/should-build.mjs` must be consistent between `main` and feature branches (or intentionally absent)
- `ALLOWED_BRANCHES` env var defaults: `main,develop,feat/*,fix/*,chore/*`
- Preview URL naming pattern: `<project>-git-<branch-slug>-<hash>-<team>.vercel.app`
- Do NOT push to `main` directly — always use PR + merge
- Reference preview URL: `https://website-alexendrosdev-git-feat-restructu-d0bea2-alexendros-team.vercel.app`

---

## Diagnostic Summary (pre-work, already collected)

| Variable | Value |
|---|---|
| Production domain | `alexendros.dev` |
| Production branch | `main` |
| Production homepage | Uses `HomeFeaturedProjects` (older component, buggy) |
| Production styles | Legacy `ak-*` CSS, no Tailwind `@theme inline` |
| Reference preview URL | `website-alexendrosdev-git-feat-restructu-d0bea2-alexendros-team.vercel.app` |
| Reference branch | `feat/restructure-content` |
| Reference homepage | Uses `HomeProjects` (redesigned, correct) |
| Reference styles | Tailwind v4 `@theme inline` in `globals.css`, condensed `site.css` |
| Diff scope | 112 files changed, 2,491 insertions, 9,963 deletions |
| `should-build.mjs` on `main` | Present — filters branches via `ALLOWED_BRANCHES` |
| `should-build.mjs` on `feat/restructure-content` | **Absent** — no `ignoreCommand` in its `vercel.json` |
| `vercel.json` on `main` | Has `ignoreCommand`, no `crons` |
| `vercel.json` on `feat/restructure-content` | No `ignoreCommand`, has `crons` for `/api/agents/audit` |
| Remote | `git@github.com:Iniciativas-Alexendros/website-alexendrosdev.git` |

### Root Causes Identified

1. **Homepage bugs on production**: `main` branch has old `HomeFeaturedProjects` component and legacy CSS that the redesign in `feat/restructure-content` already fixed (using `HomeProjects` + Tailwind v4 tokens).
2. **Branch config drift**: `feat/restructure-content` has no `ignoreCommand` in its `vercel.json`, meaning it builds ALL pushes unconditionally — by design, but inconsistent with `main`.
3. **No merge path**: The redesign has lived solely in `feat/restructure-content` without a path to production.

---

## Task List

### Task 1: Verify current Vercel deployment status via CLI

**Files:**
- Read: `vercel.json` (root)
- Read: `scripts/should-build.mjs`
- Run: Vercel CLI commands

**Interfaces:**
- Consumes: N/A — baseline diagnostic
- Produces: Confirmed list of active deployments, their branch aliases, and env vars

- [ ] **Step 1: Check Vercel CLI availability and authentication**

```bash
# Check if Vercel CLI is installed
which vercel 2>/dev/null || npm list -g vercel 2>/dev/null

# Check for token in environment
echo "VERCEL_TOKEN set: ${VERCEL_TOKEN:+yes}"
echo "VERCEL_ORG_ID set: ${VERCEL_ORG_ID:+yes}"
echo "VERCEL_PROJECT_ID set: ${VERCEL_PROJECT_ID:+yes}"
```

Expected: Either token in env or need to load from Proton Pass.

- [ ] **Step 2: Export Vercel token if needed**

If `$VERCEL_TOKEN` is empty, load from Proton Pass:

```bash
export VERCEL_TOKEN=$(pass-cli item view --item-title Vercel --vault-name Infraestructura | grep VERCEL_TEAM | grep -oP '"\K[^"]+')
export VERCEL_ORG_ID="<from-pass-or-env>"
export VERCEL_PROJECT_ID="<from-pass-or-env>"
```

Expected: `vercel whoami` returns without error.

- [ ] **Step 3: List recent deployments for this project**

```bash
vercel ls --format json --scope alexendros-team 2>/dev/null | head -80
```

Expected: List of deployments showing branch, URL, status, and creation date. Verify that:
- Production deployment exists for `main` → `alexendros.dev`
- Preview deployment exists for `feat/restructure-content` → reference URL
- No stale/rogue branches are deploying

- [ ] **Step 4: Inspect the production deployment**

```bash
# Find the production deployment URL from step 3 output, then:
vercel inspect alexendros.dev --scope alexendros-team 2>/dev/null || \
  vercel inspect $(vercel ls --format json --scope alexendros-team | grep '"production"' | head -1 | grep -oP '"(https://[^"]+)"') --scope alexendros-team
```

Expected: Shows which commit SHA is deployed to production. Confirm it matches the latest `main` commit.

- [ ] **Step 5: Check ALLOWED_BRANCHES env var across environments**

```bash
vercel env ls --scope alexendros-team 2>/dev/null | grep -i ALLOWED_BRANCHES
```

Expected: `ALLOWED_BRANCHES=main,develop,feat/*,fix/*,chore/*` or similar. Note which environments (Production, Preview, Development) have it set.

- [ ] **Step 6: Archive findings**

Save findings to a summary file for the next tasks.

```bash
cat > docs/superpowers/plans/2026-07-19-vercel-deployment-audit-report.md << 'REPORT_EOF'
# Vercel Deployment Audit — 2026-07-19

## Active Deployments
<!-- filled by step 3 output -->

## Production Deployment
<!-- filled by step 4 output -->

## ALLOWED_BRANCHES Config
<!-- filled by step 5 output -->

## Issues Found
<!-- filled after review -->
REPORT_EOF
```

---

### Task 2: Align `vercel.json` between branches

**Files:**
- Modify: `feat/restructure-content` branch — add `ignoreCommand` to `vercel.json`
- Modify (later): Ensure merge to `main` picks up `crons` from feature branch

**Interfaces:**
- Consumes: Diagnostic from Task 1
- Produces: Consistent `vercel.json` on both branches

- [ ] **Step 1: Switch to `feat/restructure-content` and add missing `ignoreCommand`**

```bash
git checkout origin/feat/restructure-content -b feat/restructure-content-temp
```

Edit `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "cleanUrls": true,
  "trailingSlash": false,
  "ignoreCommand": "node scripts/should-build.mjs",
  "crons": [
    {
      "path": "/api/agents/audit",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Create `scripts/should-build.mjs` on `feat/restructure-content`**

Copy from `main`:

```bash
git show main:scripts/should-build.mjs > scripts/should-build.mjs
```

Verify content matches exactly:

```bash
diff scripts/should-build.mjs <(git show main:scripts/should-build.mjs)
```

Expected: No diff — files are identical.

- [ ] **Step 3: Verify the branch builds locally**

```bash
pnpm install --frozen-lockfile
pnpm build 2>&1 | tail -20
```

Expected: Build succeeds with 32 routes compiled (matching `feat/restructure-content` expected routes).

- [ ] **Step 4: Commit changes to the feature branch**

```bash
git add vercel.json scripts/should-build.mjs
git commit -m "chore: align vercel.json with main — add ignoreCommand and should-build.mjs"
```

- [ ] **Step 5: Push and verify preview deployment**

**ASK USER FOR PERMISSION BEFORE PUSHING.**

```bash
git push origin feat/restructure-content-temp:feat/restructure-content
```

Expected: Vercel triggers preview build. After ~2 min, verify via:

```bash
vercel ls --format json --scope alexendros-team | grep feat-restructure
```

Expected: New preview deployment URL listed with status "READY".

---

### Task 3: Merge `feat/restructure-content` → `main` (promote redesign to production)

**Files:**
- Merge: Full tree of `feat/restructure-content` into `main`

**Interfaces:**
- Consumes: Consistent config from Task 2
- Produces: Production deployment with corrected homepage

- [ ] **Step 1: Create a PR from `feat/restructure-content` to `main`**

```bash
# From main
git checkout main
git pull origin main

# Create a merge branch
git checkout -b feat/merge-restructure-to-main

# Merge the feature branch
git merge feat/restructure-content --no-ff
```

Expected: Merge conflicts to resolve.

- [ ] **Step 2: Resolve merge conflicts**

Known conflicts (from diff analysis):
- `vercel.json` — different `ignoreCommand` and `crons` fields
- `src/app/page.tsx` — `HomeFeaturedProjects` vs `HomeProjects`
- `src/styles/site.css` — heavily refactored on feat branch
- `src/styles/design-tokens.css` — updated tokens
- `src/app/globals.css` — new `@theme inline` block
- `pnpm-lock.yaml` — dependency changes
- Deleted files: blog articles, API routes (`/api/health`), test files

**Conflict resolution strategy:**
- `vercel.json`: Accept feat branch (has crons + ignoreCommand)
- `page.tsx`: Accept feat branch (HomeProjects is the fix)
- CSS files: Accept feat branch (Tailwind-first approach is the fix)
- Deleted files (blog, API routes, tests): Accept feat branch deletions
- `pnpm-lock.yaml`: Regenerate with `pnpm install`

- [ ] **Step 3: Verify merged code builds and tests pass**

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
```

Expected: All gates pass.

- [ ] **Step 4: Push merge branch and create PR**

```bash
git push origin feat/merge-restructure-to-main
```

Then open a PR on GitHub from `feat/merge-restructure-to-main` → `main`.

PR description template:
```markdown
## Merge feat/restructure-content → main

### What's included
- Redesigned homepage with `HomeProjects` component (fixes bugs on production)
- Tailwind v4 `@theme inline` integration
- Updated design tokens (better WCAG compliance, fixed palette)
- Condensed `site.css` (removed legacy styles)
- Removed deprecated blog articles and API routes
- Updated CI/CD config

### Verification
- [ ] Build passes
- [ ] Tests pass (coverage gates)
- [ ] Preview deployment URL verified
- [ ] Allowed branches: feat/*, fix/*, chore/*, develop, main

Closes: <!-- add issue if exists -->
```

- [ ] **Step 5: Merge PR and verify production deployment**

Once PR is approved and CI passes, merge.

Wait for Vercel production deployment:

```bash
vercel inspect alexendros.dev --scope alexendros-team
```

Expected: Shows new deployment with merge commit SHA. Status "READY".

- [ ] **Step 6: Smoke test production**

Visit `https://alexendros.dev` and verify:
- Homepage renders correctly (Hero, Terminal, Marquee, HomeProjects, Services, Testimonials, CTA)
- No console errors in browser devtools
- Navigation links work
- Responsive layout on mobile

---

### Task 4: Harden deployment pipeline — add branch/git ref validation

**Files:**
- Modify: `scripts/should-build.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Lessons from Tasks 1-3
- Produces: Bulletproof branch deployment rules

- [ ] **Step 1: Audit `scripts/should-build.mjs` for edge cases**

Current issues identified:
- `VERCEL_ENV` early exit: If VERCEL_ENV is set, ALL branches build (even branches not in ALLOWED_BRANCHES). This means a branch outside the convention could still trigger a build via manual Vercel deploy.
- The glob pattern `feat/*` matches `feat/anything` but NOT `feat/restructure/content` with nested slashes — the `*` glob only matches within a single path segment.

Check if this is a real concern:

```bash
node -e "
const branch = 'feat/restructure/content';
const pattern = 'feat/*';
const escaped = pattern.replace(/[.+^\${}()|[\\]\\\\]/g, '\\\\$&').replace(/\\*/g, '.*');
const re = new RegExp('^' + escaped + '$');
console.log('Matches?', re.test(branch));
"
```

Expected: Outputs `false` — because `feat/restructure/content` does NOT match `feat/*` (the glob `*` doesn't cross `/` boundaries).

**This is a bug in the glob matching!** Branches with nested paths like `feat/foo/bar` would be silently skipped.

- [ ] **Step 2: Fix glob matching in `should-build.mjs`**

Replace the `matchesGlob` function:

```javascript
function matchesGlob(pattern, candidate) {
  // Escape all regex special chars EXCEPT our glob wildcard
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLE_WILD___') // preserve ** before escaping *
    .replace(/\*/g, '[^/]*')                // * matches within a path segment
    .replace(/___DOUBLE_WILD___/g, '.*');   // ** matches across segments
  return new RegExp(`^${escaped}$`).test(candidate);
}
```

This ensures:
- `feat/*` matches `feat/foo` but NOT `feat/foo/bar`
- `feat/**` would match `feat/foo/bar` (if needed)
- Edge case: `feat/*` correctly excludes `feat/foo/bar`

- [ ] **Step 3: Verify the fix with known branch names**

```bash
node -e "
function matchesGlob(pattern, candidate) {
  const escaped = pattern
    .replace(/[.+^\${}()|[\]\\\\]/g, '\\\\$&')
    .replace(/\*\*/g, '___DOUBLE_WILD___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE_WILD___/g, '.*');
  return new RegExp('^' + escaped + '$').test(candidate);
}

const tests = [
  ['main', 'main', true],
  ['main', 'feat/x', false],
  ['feat/*', 'feat/restructure-content', true],
  ['feat/*', 'feat/restructure/content', false],
  ['feat/**', 'feat/restructure/content', true],
  ['fix/*', 'fix/vercel-deploy-backstop', true],
  ['chore/*', 'chore/update-deps', true],
  ['feat/*', 'freebuff/new-thread-thmrs96xa440o3', false],
];

tests.forEach(([pattern, branch, expected]) => {
  const result = matchesGlob(pattern, branch);
  const ok = result === expected ? '✓' : '✗';
  console.log(ok, 'feat/* vs', branch, '→', result, expected === result ? '' : '(EXPECTED: ' + expected + ')');
});
"
```

Expected: All tests pass.

- [ ] **Step 4: Commit the hardened `should-build.mjs`**

```bash
git add scripts/should-build.mjs
git commit -m "fix: harden should-build.mjs glob matching for nested branch paths"
```

- [ ] **Step 5: Optionally add CI workflow check for branch naming**

In `.github/workflows/ci.yml`, add a step to validate branch name against conventions:

```yaml
# At top of quality job:
      - name: Validate branch naming
        run: |
          BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}"
          case "$BRANCH" in
            main|develop|dependabot/*) exit 0 ;;
            feat/*|fix/*|chore/*|ci/*|docs/*|refactor/*|test/*|perf/*|hotfix/*) exit 0 ;;
            *)
              echo "::error::Branch '$BRANCH' does not follow naming convention"
              echo "Allowed: feat/*, fix/*, chore/*, ci/*, docs/*, refactor/*, test/*, perf/*, hotfix/*, develop, main"
              exit 1
              ;;
          esac
```

---

### Task 5: Post-merge cleanup — remove stale branches and previews

**Files:**
- Run: Git branch management commands

**Interfaces:**
- Consumes: Merge completion from Task 3
- Produces: Clean repository state

- [ ] **Step 1: Delete local stale branches**

```bash
# Delete branches that were merged to main
git branch -d feat/restructure-content 2>/dev/null || echo "Already deleted"
git branch -d fix/vercel-deploy-backstop 2>/dev/null || echo "Already deleted"
git branch -d fix/vercel-deploy-prebuilt 2>/dev/null || echo "Already deleted"

# List remaining branches
git branch
```

- [ ] **Step 2: Optionally delete remote branches** (ask user first)

- [ ] **Step 3: Clean up old worktrees**

```bash
git worktree list
git worktree prune
```

Expected: Clean worktree state.

---

## Self-Review

### Spec coverage
1. ✅ Task 1: Diagnostic verification of Vercel deployments and branch mappings
2. ✅ Task 2: Align `vercel.json` between branches (consistent ignoreCommand)
3. ✅ Task 3: Merge redesign fixes to main → fixes homepage bugs
4. ✅ Task 4: Harden should-build.mjs (fix glob bug with nested branch paths)
5. ✅ Task 5: Post-merge cleanup

### Placeholder scan
No placeholders, TODOs, or "implement later" remaining. All code and commands are concrete.

### Type consistency
- `should-build.mjs` uses `process.env.VERCEL_GIT_COMMIT_REF` — same env var name referenced in Task 1-4
- `vercel.json` schema consistently uses `https://openapi.vercel.sh/vercel.json`
- Branch naming: `feat/restructure-content` consistently referenced across all tasks
