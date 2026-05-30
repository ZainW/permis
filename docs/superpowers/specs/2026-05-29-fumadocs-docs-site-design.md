# Fumadocs + TanStack Start Docs Site Design

**Date:** 2026-05-29
**Status:** Approved
**Scope:** Public-facing documentation site for @permis/\* packages

---

## Goal

Public-facing documentation site for the permis library (`@permis/core`, `@permis/drizzle`, `@permis/better-auth`). Built with Fumadocs + TanStack Start, deployed to Cloudflare Pages.

## Package Structure

New package at `packages/docs/` — a private workspace member (not published to npm):

```
packages/docs/
├── package.json              # @permis/docs (private)
├── vite.config.ts            # TanStack Start + Vite config
├── tsconfig.json
├── public/                   # Static assets (favicon, og image)
├── src/
│   ├── app/                  # TanStack Start file-based routes
│   │   ├── ssr.tsx           # SSR entry
│   │   ├── client.tsx        # Client entry
│   │   ├── router.tsx        # Router definition
│   │   ├── routes/
│   │   │   ├── __root.tsx    # Root layout with Fumadocs layout provider
│   │   │   ├── index.tsx     # Landing page
│   │   │   ├── docs/
│   │   │   │   └── $.tsx     # Catch-all for MDX doc pages
│   │   │   └── api/
│   │   │       └── $.tsx     # Catch-all for API reference pages
│   │   └── lib/
│   │       └── source.ts     # Fumadocs source collection definition
│   └── content/              # MDX documentation content
│       └── docs/
│           ├── index.mdx          # Getting Started
│           ├── concepts/
│           │   ├── rbac.mdx
│           │   ├── abac.mdx
│           │   ├── conditions.mdx
│           │   └── role-merging.mdx
│           ├── adapters/
│           │   ├── drizzle.mdx
│           │   └── better-auth.mdx
│           └── guides/
│               ├── quick-start.mdx
│               ├── defining-permissions.mdx
│               └── engine-usage.mdx
└── wrangler.toml             # Cloudflare Pages configuration
```

## Technology Stack

| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| Framework     | `@tanstack/react-start` (SSR, file-based routing)            |
| Docs          | `@fumadocs/core` + `fumadocs-ui` (layout, sidebar, search)   |
| API Reference | `fumadocs-typescript` (TypeDoc-based auto-generation)        |
| Content       | MDX with Fumadocs remark/rehype plugins                      |
| Styling       | Fumadocs UI default theme (customized via `createPreset`)    |
| Deployment    | Cloudflare Pages (connected via Git, no wrangler CLI needed) |
| Runtime       | React 19, Node.js SSR mode                                   |

## Dependencies (`packages/docs/package.json`)

- `@fumadocs/core` — MDX processing, source collections, search index
- `fumadocs-ui` — Pre-built layout, sidebar, TOC, card components
- `fumadocs-typescript` — Auto-generate API reference from TypeScript source
- `@tanstack/react-start` — SSR file-based router + RSCs
- `@tanstack/react-router` — Required by Start
- `@tanstack/react-start-vite` — Vite plugin
- `react`, `react-dom` ^19
- `@permis/core` (dev dep — consumed via workspace protocol for TypeDoc)

No wrangler dependency — Cloudflare Pages connects via Git with dashboard-configured build settings.

## API Reference Generation

Use `fumadocs-typescript`:

1. During build, runs TypeDoc against `packages/*/dist/*.d.mts` files
2. Generates structured JSON output
3. Rendered via Fumadocs TypeDoc page components into `src/app/routes/api/$.tsx`
4. Three packages covered: `@permis/core`, `@permis/drizzle`, `@permis/better-auth`

No manual API doc maintenance needed — regenerated on each build from source types.

## Navigation Structure

**Top-level nav:**

- Docs
- API Reference
- GitHub (external link)

**Docs sidebar sections:**

1. Getting Started
2. Concepts (RBAC, ABAC, Conditions, Role Merging)
3. Guides (Quick Start, Defining Permissions, Engine Usage)
4. Adapters (Drizzle, Better-Auth)

**API sidebar sections:**

1. @permis/core
2. @permis/drizzle
3. @permis/better-auth

## Theming

- Fumadocs UI base theme with `createPreset`
- Custom brand name ("Permis"), favicon, OG image
- Light/dark mode via built-in Fumadocs toggle
- Minimal customization — focus on content clarity over visual flair

## Build Flow

1. `@permis/*` packages already build via `tsdown` → outputs `.d.mts` to `dist/`
2. Docs build script: `fumadocs-typedoc` (generates API JSON) then `tanstack-start build` (SSR output to `dist/`)
3. No changes to existing packages — docs consume built dist files

## Deployment (Cloudflare Pages)

- Connect GitHub repo in Cloudflare Pages dashboard
- Build command: `pnpm --filter @permis/docs build`
- Output directory: `packages/docs/dist`
- Auto-deploys on push to configured branch (likely `main`)

## Non-Goals

- No custom UI components (Fumadocs defaults suffice)
- No search-as-a-service (Fumadocs built-in search index)
- No i18n
- No versioned docs (single version for now)
- No changes to existing `packages/core`, `packages/drizzle`, or `packages/better-auth`
