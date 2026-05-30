# Fumadocs + TanStack Start Docs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing documentation site for the permis library using Fumadocs + TanStack Start, deployed to Cloudflare Pages.

**Architecture:** New `packages/docs/` workspace package. TanStack Start handles SSR routing with Fumadocs UI providing the docs layout, sidebar, search, and API reference. MDX content in `content/docs/` is processed by fumadocs-mdx. fumadocs-typescript auto-generates type tables from TypeScript source. Deploy via Cloudflare Pages Git integration.

**Tech Stack:** TanStack Start (SSR), Fumadocs (docs framework), React 19, Tailwind CSS v4, Cloudflare Vite plugin

---

### Task 1: Scaffold docs package

**Files:**

- Create: `packages/docs/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@permis/docs",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@cloudflare/vite-plugin": "^1.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@tanstack/react-router": "^1.114.0",
    "@tanstack/react-start": "^1.114.0",
    "fumadocs-core": "^15.0.0",
    "fumadocs-mdx": "^12.0.0",
    "fumadocs-typescript": "^3.0.0",
    "fumadocs-ui": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/mdx": "^2.0.0",
    "@types/node": "^25.9.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "wrangler": "^4.0.0"
  }
}
```

_Note: exact versions will be resolved by pnpm at install time._

- [ ] **Step 2: Verify package.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('packages/docs/package.json','utf8'))"`

---

### Task 2: Scaffold tsconfig.json

**Files:**

- Create: `packages/docs/tsconfig.json`

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "collections/*": ["./.source/*"]
    }
  },
  "include": ["src", ".source"]
}
```

---

### Task 3: Scaffold vite.config.ts

**Files:**

- Create: `packages/docs/vite.config.ts`

- [ ] **Step 1: Create vite.config.ts**

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import mdx from "fumadocs-mdx/vite";

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    mdx(),
    tailwindcss(),
  ],
});
```

---

### Task 4: Scaffold source.config.ts and wrangler.jsonc

**Files:**

- Create: `packages/docs/source.config.ts`
- Create: `packages/docs/wrangler.jsonc`

- [ ] **Step 1: Create source.config.ts**

```ts
import { defineDocs } from "fumadocs-mdx/config";
import {
  remarkAutoTypeTable,
  createGenerator,
  createFileSystemGeneratorCache,
} from "fumadocs-typescript";

const generator = createGenerator({
  cache: createFileSystemGeneratorCache(".output/fumadocs-typescript"),
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    mdxOptions: {
      remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    },
  },
});
```

- [ ] **Step 2: Create wrangler.jsonc**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "permis-docs",
  "compatibility_date": "2026-05-29",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true },
}
```

---

### Task 5: Run pnpm install

- [ ] **Step 1: Install dependencies for the new package**

Run: `pnpm install --filter @permis/docs`

Expected: resolves and installs all deps, updates pnpm-lock.yaml.

---

### Task 6: Create router.tsx

**Files:**

- Create: `packages/docs/src/router.tsx`

- [ ] **Step 1: Create src/router.tsx**

```tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
}
```

---

### Task 7: Create \_\_root.tsx (root route with Fumadocs provider)

**Files:**

- Create: `packages/docs/src/routes/__root.tsx`

- [ ] **Step 1: Create src/routes/\_\_root.tsx**

```tsx
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/tanstack";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Permis" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

---

### Task 8: Create Fumadocs source loader

**Files:**

- Create: `packages/docs/src/lib/source.ts`

- [ ] **Step 1: Create src/lib/source.ts**

```ts
import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
```

---

### Task 9: Create MDX components and shared layout

**Files:**

- Create: `packages/docs/src/components/mdx.tsx`
- Create: `packages/docs/src/lib/layout.shared.tsx`

- [ ] **Step 1: Create src/components/mdx.tsx**

```tsx
import defaultMdxComponents from "fumadocs-ui/mdx";
import { TypeTable } from "fumadocs-ui/components/type-table";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
```

- [ ] **Step 2: Create src/lib/layout.shared.tsx**

```tsx
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Permis",
    },
    links: [
      {
        text: "Docs",
        url: "/docs",
        active: "nested-url",
      },
      {
        text: "API",
        url: "/docs/api",
        active: "nested-url",
      },
      {
        text: "GitHub",
        url: "https://github.com/your-org/permis",
        external: true,
      },
    ],
  };
}
```

---

### Task 10: Create home page route

**Files:**

- Create: `packages/docs/src/routes/index.tsx`

- [ ] **Step 1: Create src/routes/index.tsx**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Permis</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        TypeScript permissions library — RBAC + ABAC with Drizzle and Better-Auth adapters
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/docs"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/your-org/permis"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          GitHub
        </a>
      </div>
    </main>
  );
}
```

---

### Task 11: Create docs catch-all route

**Files:**

- Create: `packages/docs/src/routes/docs/$.tsx`

- [ ] **Step 1: Create src/routes/docs/$.tsx**

```tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { source } from "@/lib/source";
import browserCollections from "collections/browser";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { baseOptions } from "@/lib/layout.shared";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense } from "react";
import { useMDXComponents } from "@/components/mdx";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({ method: "GET" })
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();
    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }, _props: undefined) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());
  return (
    <DocsLayout {...baseOptions()} tree={data.pageTree}>
      <Suspense>{clientLoader.useContent(data.path)}</Suspense>
    </DocsLayout>
  );
}
```

---

### Task 12: Create search API route

**Files:**

- Create: `packages/docs/src/routes/api/search.ts`

- [ ] **Step 1: Create src/routes/api/search.ts**

```ts
import { createFileRoute } from "@tanstack/react-router";
import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

const searchServer = createFromSource(source, { language: "english" });

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => searchServer.GET(request),
    },
  },
});
```

---

### Task 13: Create CSS entry and import in root route

**Files:**

- Create: `packages/docs/src/styles/app.css`
- Modify: `packages/docs/src/routes/__root.tsx`

- [ ] **Step 1: Create src/styles/app.css**

```css
@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
```

- [ ] **Step 2: Add CSS import to \_\_root.tsx**

Add this import at the top of `src/routes/__root.tsx`, after the existing imports:

```tsx
import "@/styles/app.css";
```

---

### Task 14: Write Getting Started MDX

**Files:**

- Create: `packages/docs/content/docs/index.mdx`
- Create: `packages/docs/content/docs/meta.json`

- [ ] **Step 1: Create meta.json (sidebar structure)**

```json
{
  "title": "Docs",
  "pages": [
    ["Getting Started", "index"],
    "---Concepts---",
    ["RBAC", "concepts/rbac"],
    ["ABAC", "concepts/abac"],
    ["Conditions", "concepts/conditions"],
    ["Role Merging", "concepts/role-merging"],
    "---Guides---",
    ["Quick Start", "guides/quick-start"],
    ["Defining Permissions", "guides/defining-permissions"],
    ["Engine Usage", "guides/engine-usage"],
    "---Adapters---",
    ["Drizzle ORM", "adapters/drizzle"],
    ["Better-Auth", "adapters/better-auth"]
  ]
}
```

- [ ] **Step 2: Create content/docs/index.mdx**

````mdx
---
title: Getting Started
description: Install and configure Permis for your application
---

## What is Permis?

Permis is a TypeScript permissions library supporting **Role-Based Access Control (RBAC)** and **Attribute-Based Access Control (ABAC)**. It provides a fluent builder API to define permissions, roles, and conditions, with a zero-dependency core and adapters for Drizzle ORM and Better-Auth.

## Installation

```bash
pnpm add @permis/core
```
````

For database-backed permission storage:

```bash
pnpm add @permis/drizzle   # Drizzle ORM adapter
pnpm add @permis/better-auth  # Better-Auth plugin + bridge
```

## Quick Example

```ts
import { definePermission, PermisEngine } from "@permis/core";

const readDocs = definePermission("documents").can("read").where("status", "published").build();

const reader = defineRole("reader").grantAll([readDocs]).build();

const engine = new PermisEngine({ roles: [reader] });

const result = engine.can(reader, "read", {
  type: "documents",
  status: "published",
}); // => true
```

````

---

### Task 15: Write Concepts MDX files

**Files:**
- Create: `packages/docs/content/docs/concepts/rbac.mdx`
- Create: `packages/docs/content/docs/concepts/abac.mdx`
- Create: `packages/docs/content/docs/concepts/conditions.mdx`
- Create: `packages/docs/content/docs/concepts/role-merging.mdx`

- [ ] **Step 1: Create concepts/rbac.mdx**

```mdx
---
title: Role-Based Access Control (RBAC)
description: Define roles with permissions and manage access by role assignment
---

RBAC in Permis is built around two core concepts: **permissions** (what actions can be performed on what resources) and **roles** (collections of permissions assigned to users).

## Defining Permissions

A permission defines an action that can be performed on a resource type:

```ts
import { definePermission } from '@permis/core'

const editPosts = definePermission('posts')
  .can('edit')
  .build()
````

## Defining Roles

A role groups permissions together:

```ts
import { defineRole } from "@permis/core";

const editor = defineRole("editor").grantAll([editPosts]).build();
```

## Checking Access

Use `PermisEngine` to check if a role can perform an action:

```ts
const engine = new PermisEngine({ roles: [editor] });

engine.can(editor, "edit", { type: "posts" }); // => true
engine.can(editor, "delete", { type: "posts" }); // => false
```

## Resource Matching

Resource matching uses the `type` field by default. Permissions only apply to resources with matching types:

```ts
const readDocs = definePermission("documents").can("read").build();

engine.can(readDocs, "read", { type: "documents" }); // => true
engine.can(readDocs, "read", { type: "images" }); // => false
```

````

- [ ] **Step 2: Create concepts/abac.mdx**

```mdx
---
title: Attribute-Based Access Control (ABAC)
description: Fine-grained access control based on resource and subject attributes
---

ABAC extends RBAC with attribute-based conditions. Permis supports three types of conditions: `when`, `where`, and `having`.

## When Conditions

`when` takes an arbitrary function that receives the subject and resource and returns a boolean:

```ts
definePermission('posts')
  .can('edit')
  .when((subject, resource) => subject.id === resource.authorId)
  .build()
````

## Where Conditions

`where` provides path-based matching against resource properties. Supports literal values, arrays, and regex patterns:

```ts
definePermission("documents")
  .can("read")
  .where("status", ["published", "draft"])
  .where("team", /^engineering-/)
  .build();
```

## Having Conditions

`having` validates resource properties using the Standard Schema specification (compatible with Zod, ArkType, Valibot):

```ts
definePermission("documents").can("write").having("classification", "classified").build();
```

````

- [ ] **Step 3: Create concepts/conditions.mdx**

```mdx
---
title: Conditions
description: Deep dive into Permis condition types — when, where, and having
---

Conditions determine whether a permission should be granted based on runtime attributes.

## Compound Conditions

Multiple conditions on a permission must all pass (logical AND):

```ts
const editOwn = definePermission('posts')
  .can('edit')
  .when((s, r) => s.id === r.authorId)
  .where('status', 'draft')
  .build()
````

## Chained Where Conditions

`where` supports method chaining. Each call adds another condition that must match:

```ts
const advanced = definePermission("documents")
  .can("view")
  .where("status", "published")
  .where("classification", "public")
  .where("category", ["legal", "finance"])
  .build();
```

## Condition Evaluation Order

1. Resource type match
2. Action match
3. `where` conditions
4. `when` conditions
5. `having` conditions

All conditions must pass for the permission to be granted.

````

- [ ] **Step 4: Create concepts/role-merging.mdx**

```mdx
---
title: Role Merging
description: Combine roles to create role hierarchies with inherited permissions
---

`mergeRoles` combines multiple roles into one, resolving permission conflicts with a configurable strategy.

## Basic Usage

```ts
import { mergeRoles } from '@permis/core'

const readDocs = definePermission('documents').can('read').build()
const writeDocs = definePermission('documents').can('write').build()

const reader = defineRole('reader').grantAll([readDocs]).build()
const writer = defineRole('writer').grantAll([writeDocs]).build()

const powerUser = mergeRoles('power-user', [reader, writer])

// powerUser has both read and write on documents
````

## Conflict Resolution

When two roles grant different permissions on the same resource, you can choose a resolution strategy:

```ts
const strict = mergeRoles("strict", [roleA, roleB], { conflict: "deny" });
const permissive = mergeRoles("permissive", [roleA, roleB], { conflict: "allow" });
```

````

---

### Task 16: Write Guides MDX files

**Files:**
- Create: `packages/docs/content/docs/guides/quick-start.mdx`
- Create: `packages/docs/content/docs/guides/defining-permissions.mdx`
- Create: `packages/docs/content/docs/guides/engine-usage.mdx`

- [ ] **Step 1: Create guides/quick-start.mdx**

```mdx
---
title: Quick Start
description: Get up and running with Permis in 5 minutes
---

## 1. Install

```bash
pnpm add @permis/core
````

## 2. Define Permissions

```ts
import { definePermission } from "@permis/core";

const readDocs = definePermission("documents").can("read").where("status", "published").build();

const writeDocs = definePermission("documents").can("write").build();

const manageUsers = definePermission("users").can("manage").build();
```

## 3. Define Roles

```ts
import { defineRole } from "@permis/core";

const reader = defineRole("reader").grantAll([readDocs]).build();

const editor = defineRole("editor").grantAll([readDocs, writeDocs]).build();

const admin = defineRole("admin").grantAll([manageUsers]).build();
```

## 4. Create Engine

```ts
import { PermisEngine } from "@permis/core";

const engine = new PermisEngine({
  roles: [reader, editor, admin],
});
```

## 5. Check Permissions

```ts
engine.can(reader, "read", { type: "documents", status: "published" }); // true
engine.cannot(reader, "write", { type: "documents" }); // true
engine.authorize(admin, "manage", { type: "users" }); // returns resource or throws PermisError
```

````

- [ ] **Step 2: Create guides/defining-permissions.mdx**

```mdx
---
title: Defining Permissions
description: Master the permission builder API
---

Permissions in Permis are immutable objects created via the `definePermission` builder.

## Permission Builder API

```ts
definePermission(resourceType)
  .can(...actions)     // Define allowed actions
  .cannot(...actions)  // Explicitly deny actions
  .where(path, value)  // Attribute-based path matching
  .when(fn)            // Custom condition function
  .having(path, value)  // Schema-validated condition
  .build()             // Finalize and return Permission
````

## Actions

Actions are strings that describe what a subject can do. Common conventions:

- CRUD: `create`, `read`, `update`, `delete`
- Custom: `publish`, `archive`, `export`
- Wildcard: `manage` (full access)

```ts
definePermission("articles").can("create", "read", "update").can("publish").build();
```

## Resource Types

The resource type is a string identifier. Permissions only apply to resources with matching `type`:

```ts
const permission = definePermission("orders").can("view").build();

engine.can(permission, "view", { type: "orders", id: "123" }); // matches
engine.can(permission, "view", { type: "products", id: "456" }); // no match
```

````

- [ ] **Step 3: Create guides/engine-usage.mdx**

```mdx
---
title: Engine Usage
description: Using PermisEngine for runtime authorization
---

`PermisEngine` is the runtime component that evaluates permissions against subjects and resources.

## Constructor

```ts
const engine = new PermisEngine({
  roles: [reader, editor, admin],    // Available role definitions
  strictMode: true,                   // Throw on unknown roles
})
````

## can() and cannot()

```ts
const result = engine.can(editor, "write", {
  type: "documents",
  id: "doc-123",
});
// => true

const denied = engine.cannot(reader, "write", {
  type: "documents",
  id: "doc-123",
});
// => true
```

## authorize()

Returns the resource if authorized, throws `PermisError` if not:

```ts
try {
  const doc = engine.authorize(editor, "write", {
    type: "documents",
    id: "doc-123",
  });
  // doc is safe to use
} catch (error) {
  if (error instanceof PermisError) {
    console.error(error.message);
  }
}
```

## Error Messages

When authorization fails, `PermisError` includes a descriptive message:

```
Permission denied: role 'reader' cannot perform action 'write' on resource type 'documents'
```

````

---

### Task 17: Write Adapters MDX files

**Files:**
- Create: `packages/docs/content/docs/adapters/drizzle.mdx`
- Create: `packages/docs/content/docs/adapters/better-auth.mdx`

- [ ] **Step 1: Create adapters/drizzle.mdx**

```mdx
---
title: Drizzle ORM Adapter
description: Store permissions and roles in a database with Drizzle ORM
---

`@permis/drizzle` provides a Drizzle ORM adapter for persistent permission storage.

## Installation

```bash
pnpm add @permis/drizzle drizzle-orm
````

## Schema Setup

Create the permis tables in your Drizzle schema:

```ts
import { createPermisSchema } from "@permis/drizzle";

export const permisSchema = createPermisSchema();
// Returns: { permissions, roles, rolePermissions, subjects }
```

## Adapter Usage

Create a `drizzleAdapter` and pass it to `PermisEngine`:

```ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzleAdapter } from "@permis/drizzle";

const db = drizzle(/* your db */);
const adapter = drizzleAdapter(db, permisSchema);

const engine = new PermisEngine({
  adapter,
});
```

The adapter reads roles, permissions, and subject assignments from the database at query time. This enables dynamic permission management without restarts.

````

- [ ] **Step 2: Create adapters/better-auth.mdx**

```mdx
---
title: Better-Auth Integration
description: Integrate Permis with Better-Auth for authentication-aware authorization
---

`@permis/better-auth` provides deep integration with Better-Auth, including a plugin, session enrichment, and route guards.

## Installation

```bash
pnpm add @permis/better-auth better-auth
````

## Plugin Setup

Add the Permis plugin to your Better-Auth configuration:

```ts
import { betterAuth } from "better-auth";
import { permisPlugin } from "@permis/better-auth";

export const auth = betterAuth({
  plugins: [
    permisPlugin({
      engine: myEngine,
    }),
  ],
});
```

## Session Enrichment

The plugin automatically enriches the session with the user's permissions:

```ts
const session = await auth.api.getSession({ headers });
// session.permis now contains the user's role and resolved permissions
```

## Route Guards

Protect routes with the built-in guard middleware:

```ts
import { createGuard } from "@permis/better-auth";

const guard = createGuard({ engine: myEngine });

// In your API route:
await guard.require("write", "documents")(request);
```

## Bridge (Read-Only)

For read-only access without the full plugin, use `betterAuthBridge`:

```ts
import { betterAuthBridge } from "@permis/better-auth";

const bridge = betterAuthBridge({
  auth,
  engine: myEngine,
});

await bridge.can(userId, "read", { type: "documents" });
```

````

---

### Task 18: Create API reference MDX pages

**Files:**
- Create: `packages/docs/content/docs/api/meta.json`
- Create: `packages/docs/content/docs/api/core.mdx`
- Create: `packages/docs/content/docs/api/drizzle.mdx`
- Create: `packages/docs/content/docs/api/better-auth.mdx`

- [ ] **Step 1: Create api/meta.json**

```json
{
  "title": "API Reference",
  "pages": [
    ["@permis/core", "core"],
    ["@permis/drizzle", "drizzle"],
    ["@permis/better-auth", "better-auth"]
  ]
}
````

- [ ] **Step 2: Create api/core.mdx**

```mdx
---
title: "@permis/core"
description: Core types and API reference for @permis/core
---

## Core Types

<auto-type-table path="../../../../../packages/core/src/types.ts" name="Subject" />

<auto-type-table path="../../../../../packages/core/src/types.ts" name="Resource" />

<auto-type-table path="../../../../../packages/core/src/types.ts" name="Permission" />

<auto-type-table path="../../../../../packages/core/src/types.ts" name="Role" />

## Engine

<auto-type-table path="../../../../../packages/core/src/engine.ts" name="PermisEngine" />
```

- [ ] **Step 3: Create api/drizzle.mdx**

```mdx
---
title: "@permis/drizzle"
description: API reference for @permis/drizzle
---

<auto-type-table path="../../../../../packages/drizzle/src/schema.ts" name="PermisSchema" />

<auto-type-table path="../../../../../packages/drizzle/src/adapter.ts" name="drizzleAdapter" />
```

- [ ] **Step 4: Create api/better-auth.mdx**

```mdx
---
title: "@permis/better-auth"
description: API reference for @permis/better-auth
---

<auto-type-table path="../../../../../packages/better-auth/src/plugin.ts" name="permisPlugin" />

<auto-type-table path="../../../../../packages/better-auth/src/bridge.ts" name="betterAuthBridge" />

<auto-type-table path="../../../../../packages/better-auth/src/guard.ts" name="createGuard" />
```

---

### Task 19: Build and verify

- [ ] **Step 1: Build the docs**

Run: `pnpm --filter @permis/docs build`

Expected: Successful build with no errors. Output in `packages/docs/.output/`.

- [ ] **Step 2: Verify output directory exists**

Run: `ls packages/docs/.output/`

Expected: `public/` and `server/` directories.

- [ ] **Step 3: Check for any missing pages or broken links**

Review the build output for warnings about broken links or missing MDX pages.

---

### Task 20: Commit

- [ ] **Step 1: Stage all new files**

```bash
git add packages/docs/ pnpm-lock.yaml pnpm-workspace.yaml
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add Fumadocs + TanStack Start documentation site"
```
