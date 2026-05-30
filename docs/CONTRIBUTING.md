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
