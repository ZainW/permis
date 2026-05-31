# Publishing Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up automated, secure npm publishing for the permis monorepo via Changesets + OIDC + GitHub Actions with full CI checks.

**Architecture:** Five configuration files: a Changesets config for monorepo versioning, two GitHub Actions workflows (CI quality gate on PRs, release + publish on main), an `.npmrc` for registry resolution, and a `CONTRIBUTING.md` for developer onboarding. No source code changes — all config.

**Tech Stack:** GitHub Actions, Changesets, npm OIDC, pnpm, Vite+.

---

### Task 1: Install Changesets Dependencies

**Files:**

- Modify: `package.json` (root)

- [ ] **Step 1: Add Changesets packages to devDependencies**

Run:

```bash
pnpm add -D -w @changesets/cli @changesets/changelog-github
```

- [ ] **Step 2: Verify install**

Check that `@changesets/cli` and `@changesets/changelog-github` appear in root `devDependencies` in `package.json`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add changesets dependencies"
```

---

### Task 2: Create Changesets Config

**Files:**

- Create: `.changeset/config.json`

- [ ] **Step 1: Create `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "zainw/permis" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@permis/docs"]
}
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/config.json
git commit -m "chore: add changesets config"
```

---

### Task 3: Create CI Workflow (`ci.yml`)

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: ["**"]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Test
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm check

      - run: pnpm test
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint, typecheck, and test workflow"
```

---

### Task 4: Create Release Workflow (`release.yml`)

**Files:**

- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add changesets release workflow with OIDC"
```

**Note:** `NPM_CONFIG_PROVENANCE: true` enables npm provenance attestations, which verify the package was built by the linked GitHub Actions workflow. This requires `id-token: write` permission (already set) and the OIDC trust policy on npm.

---

### Task 5: Create `.npmrc`

**Files:**

- Create: `.npmrc`

- [ ] **Step 1: Create `.npmrc`**

```
@permis:registry=https://registry.npmjs.org/
```

- [ ] **Step 2: Commit**

```bash
git add .npmrc
git commit -m "chore: add .npmrc for @permis scope registry"
```

---

### Task 6: Create `docs/CONTRIBUTING.md`

**Files:**

- Create: `docs/CONTRIBUTING.md`

- [ ] **Step 1: Create `docs/CONTRIBUTING.md`**

````markdown
# Contributing to Permis

## Setup

```bash
pnpm install
pnpm build
```

## Development

Run checks and tests before opening a PR:

```bash
pnpm check
pnpm test
```

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

**When to add a changeset:** When your PR changes any published package (`@permis/core`, `@permis/drizzle`, `@permis/better-auth`). Documentation-only changes do not need one.

**How to add a changeset:**

```bash
npx changeset
```

The CLI will prompt you to:

1. Select which packages changed (use space to select, enter to confirm)
2. Choose the semver bump: `major`, `minor`, or `patch`
3. Write a summary of the change

This creates a `.md` file in `.changeset/` — commit it with your PR.

**How releases work:**

1. When a PR with changesets is merged to `main`, the Changesets bot opens a "Version Packages" PR with bumped versions and updated changelogs
2. A maintainer reviews and merges that PR
3. Packages are automatically published to npm

## Package Layout

| Package            | Path                   | npm                      |
| ------------------ | ---------------------- | ------------------------ |
| Core               | `packages/core`        | `@permis/core`           |
| Drizzle adapter    | `packages/drizzle`     | `@permis/drizzle`        |
| Better-Auth plugin | `packages/better-auth` | `@permis/better-auth`    |
| Docs site          | `packages/docs`        | (private, not published) |
````

- [ ] **Step 2: Commit**

```bash
git add docs/CONTRIBUTING.md
git commit -m "docs: add contributing guide"
```

---

### Task 7: Verify Build Works

- [ ] **Step 1: Run check**

```bash
vp check
```

Expected: all lint, format, and type checks pass.

- [ ] **Step 2: Run tests**

```bash
vp test
```

Expected: all tests pass.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: all three packages build to `dist/` without errors.

---

### Task 8: Final Review

- [ ] **Step 1: Review all files created/modified**

```bash
git status
```

Expected files:

- `package.json` (modified — added changesets deps)
- `pnpm-lock.yaml` (modified)
- `.changeset/config.json` (new)
- `.github/workflows/ci.yml` (new)
- `.github/workflows/release.yml` (new)
- `.npmrc` (new)
- `docs/CONTRIBUTING.md` (new)

- [ ] **Step 2: Review git log**

```bash
git log --oneline -10
```

- [ ] **Step 3: Manual steps reminder**

The following must be done once, outside this plan:

1. **npm OIDC trust:** In npm web UI → `@permis` scope → Settings → OIDC Trust Policies → add policy:
   - Owner: `zainw`
   - Repo: `permis`
   - Workflow: `release.yml`
   - Ref: `refs/heads/main`

2. **Create GitHub repo:** `zainw/permis`

3. **Push to GitHub:**

   ```bash
   git remote add origin git@github.com:zainw/permis.git
   git push -u origin main
   ```

4. **Branch protection:** GitHub repo → Settings → Branches → Add rule for `main`:
   - Require status checks to pass: `Lint, Typecheck, Test`
   - Require branches to be up to date before merging
