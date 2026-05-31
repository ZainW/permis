# Permis — Publishing Flow Design

## Overview

Automated, secure npm publishing pipeline for the permis monorepo using Changesets for versioning, GitHub Actions OIDC for authentication, and full CI checks on every PR.

## Architecture

```
Feature branch → PR → CI (lint, typecheck, test)
                            ↓
                       Merge to main
                            ↓
                  Changesets bot updates
                  "Version Packages" PR
                            ↓
                       Merge that PR
                            ↓
                  CI publishes to npm via OIDC
```

### Key Decisions

| Choice                  | Rationale                                                                       |
| ----------------------- | ------------------------------------------------------------------------------- |
| Changesets              | Monorepo-aware versioning, structured changelogs, canonical for pnpm workspaces |
| OIDC (OpenID Connect)   | No long-lived tokens, GitHub Actions ID token → npm, most secure option         |
| Single publish workflow | Changesets action handles both "create version PR" and "publish" paths          |
| CI on every PR          | `vp check` + `vp test` before merge, enforces quality gate                      |

## GitHub Actions Workflows

### `ci.yml` — Quality Gate

Trigger: `pull_request` (all branches), `push` to `main`

Jobs:

1. Checkout repo
2. Setup Node 22 via `pnpm/action-setup`
3. `pnpm install --frozen-lockfile`
4. `vp check` — Oxlint, Oxfmt, type checking
5. `vp test` — Vitest across all workspace packages

Concurrency: cancel in-progress runs on same PR.

### `release.yml` — Versioning + Publish

Trigger: `push` to `main`

Permissions:

- `contents: write` (create version PRs, push tags)
- `pull-requests: write` (create/update version PR)
- `id-token: write` (OIDC token for npm)

Job uses `changesets/action`:

- **Path A** — Feature PR merged with changeset files: bot opens/updates "Version Packages" PR with bumped versions and changelogs
- **Path B** — "Version Packages" PR merged: bot detects consumed changesets, runs `pnpm prepublishOnly` (which builds all packages), then publishes each changed package to npm via OIDC

## Changesets Configuration

File: `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@permis/docs"]
}
```

- `access: "public"` — scoped packages default to private, must override
- `updateInternalDependencies: "patch"` — when a dependency is bumped, dependent gets patch bump
- `ignore: ["@permis/docs"]` — docs site is private, not published

## .npmrc

File: `.npmrc` (repo root)

```
@permis:registry=https://registry.npmjs.org/
```

No auth token stored. Local devs use `npm login`. CI uses OIDC.

## OIDC Trust Setup (One-Time, Manual)

In npm, configure the `@permis` scope to trust GitHub Actions OIDC:

1. npm web UI → Permis scope → Settings → OIDC Trust Policies
2. Add policy: `owner=zainw`, `repo=permis`, `workflow=release.yml`, `ref=refs/heads/main`
3. npm creates short-lived tokens for matching GitHub Actions runs

## Setup Steps

### One-Time Manual Steps

1. Create `@permis` scope on npm (already done)
2. Configure OIDC trust in npm scope settings
3. Create GitHub repo `zainw/permis`
4. Add branch protection on `main`: require CI (`ci.yml`) to pass before merge
5. Push code to GitHub (`git push -u origin main`)

### Automated by This Design

- Install Changesets packages (`@changesets/cli`, `@changesets/changelog-github`)
- Create `.changeset/config.json`
- Create `.github/workflows/ci.yml`
- Create `.github/workflows/release.yml`
- Create `.npmrc`
- Create `docs/CONTRIBUTING.md` with Changesets instructions

## Local Developer Workflow

1. Make changes in a feature branch
2. Run `npx changeset` and follow prompts (select changed packages, choose semver bump)
3. Commit the generated `.changeset/*.md` file
4. Open PR → CI runs → merge
5. Changesets bot accumulates changes → creates Version Packages PR
6. Merge Version Packages PR → publish happens automatically

## Changelog

Changesets generates changelogs per package in `CHANGELOG.md` files. The GitHub changelog integration uses `@changesets/changelog-github` for linking to PRs and authors.

---

## Files Created/Modified

| File                            | Action | Purpose                                |
| ------------------------------- | ------ | -------------------------------------- |
| `.github/workflows/ci.yml`      | Create | Lint, typecheck, test on PRs           |
| `.github/workflows/release.yml` | Create | Version bump + npm publish             |
| `.changeset/config.json`        | Create | Changesets configuration               |
| `.npmrc`                        | Create | npm registry resolution                |
| `package.json` (root)           | Modify | Add `@changesets/cli` devDep           |
| `docs/CONTRIBUTING.md`          | Create | Changesets onboarding for contributors |
