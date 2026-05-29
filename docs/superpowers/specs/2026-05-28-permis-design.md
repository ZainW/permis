# Permis — Permissions Library Design

## Overview

permis is a TypeScript permissions library providing RBAC + ABAC authorization with a builder-pattern API. The core is database-agnostic, isomorphic (server + browser), and has zero runtime dependencies. Adapters for drizzle and better-auth provide optional database integration.

---

## Architecture

Monorepo with three packages:

| Package               | Description                                   | Runtime Deps                         |
| --------------------- | --------------------------------------------- | ------------------------------------ |
| `@permis/core`        | Permission engine — define, check, authorize  | None                                 |
| `@permis/drizzle`     | Drizzle ORM adapter — table generation + CRUD | `@permis/core`, `drizzle-orm` (peer) |
| `@permis/better-auth` | Better-auth plugin + standalone bridge        | `@permis/core`, `better-auth` (peer) |

---

## Core (`@permis/core`)

### Data Model

```
Subject   ← string | { id, type, attrs? }
Resource  ← string | { type, id?, attrs? }
Action    ← string (e.g., create, read, update, delete, manage)

Permission {
  action: Action | Action[]
  resource: ResourceType | ResourceType[]
  condition?: Condition[]          // ABAC hooks
  fields?: string[]                // field-level restrictions
  description?: string
}

Role {
  name: string
  permissions: Permission[]
  condition?: Condition[]          // role activation conditions
}

Context {
  subject: Subject
  resource?: Resource
  action: Action
  environment?: Record<string, unknown>
}
```

### Builder API

Permissions and roles are defined using a fluent builder pattern:

```typescript
// Permission definition
const readPost = definePermission('read', 'post')

const deleteOwnPost = definePermission('delete', 'post')
  .when(ctx => ctx.subject.id === ctx.resource.ownerId)
  .where('orgId').equals('subject.orgId')

const exportReport = definePermission('export', 'report')
  .having('subject', proPlanSchema)  // standard-schema validator

// Role definition
const editor = defineRole('editor')
  .with(readPost, deleteOwnPost, exportReport)

// Engine
const permis = new PermisEngine({
  roles: [editor, admin],
  permissions: [readPost, deleteOwnPost, exportReport],
  adapter?,  // optional — in-memory if omitted
})

await permis.can('editor', 'delete', postResource)   // boolean
await permis.cannot('editor', 'manage', 'settings')   // boolean
permis.authorize('editor', 'delete', postResource)    // throws if denied
permis.getRolesFor(subjectId)                          // string[]
```

### Action and Resource Matching

- **Action matching:** An action matches if it's an exact string match or if the user has a `"manage"` permission for that resource (which implies all CRUD actions). Wildcard `"*"` matches any action.
- **Resource matching:** A resource type matches if it's an exact string match. No resource type hierarchy or wildcard.
- **Permission aggregation:** If a subject has multiple roles, permissions from all roles are combined. If any role grants the permission and all conditions pass, the check succeeds.

### Condition System

Three condition primitives. All conditions on a permission must pass (AND logic).

| Method                 | Input                                                                           | Serializable | Description                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------- | :----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.when(fn)`            | `(ctx: Context) => boolean \| Promise<boolean>`                                 |      No      | Full context access. Arbitrary sync or async logic. All conditions (including when, where, having) are evaluated concurrently per permission.                                                                            |
| `.where(path)`         | Path matcher chain: `.equals(val)` `.in(vals)` `.matches(regex)` `.ref('path')` |     Yes      | Path-based comparison. `.where('orgId').equals('acme-corp')` compares context field to literal. `.where('orgId').ref('subject.orgId')` compares two context paths. Compiles to JSON-compatible matchers, storable in DB. |
| `.having(key, schema)` | `StandardSchema` validator                                                      |     Yes      | Validates `context[key]` against a standard-schema. Users bring any compatible validator (Arktype, Zod, Valibot). Schema is stored as JSON-serializable representation.                                                  |

### Standard-Schema Integration

The core's only "dependency" on the schema ecosystem is **type-level**: it accepts any object implementing `StandardSchemaV1` (the `~standard` property). This is a protocol, not an import — no runtime dependency.

Arktype is a **dev dependency** used internally for:

- Type inference in `definePermission()` generics
- Configuration validation at definition time (dev mode)
- Normalizing `.having()` schemas through its parse pipeline

Users never interact with arktype directly unless they choose it for `.having()` schemas.

### Engine Internals

```
can(subjectId, action, resource) → boolean
    1. Resolve roles for subject (via adapter or in-memory)
    2. Resolve permissions for each role
    3. For each matching permission (action + resource match):
       a. Run all conditions against { subject, resource, action, environment }
       b. If all conditions pass → true
    4. No matching permission with passing conditions → false
```

### Adapter Interface

```typescript
interface PermisAdapter {
  // Role resolution (required)
  getRolesForSubject(subjectId: string): Promise<string[]>;
  getPermissionsForRole(roleName: string): Promise<Permission[]>;
  getPermissionsForSubject(subjectId: string): Promise<Permission[]>;

  // Subject/Resource hydration for ABAC (required)
  resolveSubject(subjectId: string): Promise<Subject>;
  resolveResource(type: string, id: string): Promise<Resource>;

  // Management (optional — read-only adapters omit these)
  assignRole?(subjectId: string, roleName: string): Promise<void>;
  revokeRole?(subjectId: string, roleName: string): Promise<void>;
  grantPermission?(roleName: string, permission: Permission): Promise<void>;
  revokePermission?(roleName: string, action: string, resource: string): Promise<void>;
}
```

Adapters can be **full** (all methods) or **read-only** (only read methods). When no adapter is provided, the engine works in-memory with statically defined roles/permissions.

---

## Drizzle Adapter (`@permis/drizzle`)

### Auto-Generated Schema

```typescript
const permisSchema = createPermisSchema();
// → { roles, permissions, rolePermissions, subjectRoles }
```

Generates four tables:

| Table                     | Key Columns                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| `permis_roles`            | name, description, condition (json), active, created_at            |
| `permis_permissions`      | id, action, resource, fields (json), condition (json), description |
| `permis_role_permissions` | role_name, permission_id                                           |
| `permis_subject_roles`    | subject_id, role_name, granted_at, granted_by                      |

### Customization (Escape Hatches)

1. **Extend generated tables:** Pass `extra` column definitions per table
2. **Bring your own tables:** Pass existing Drizzle table references
3. **Partial mode:** Only a subset of tables from DB (e.g., roles from DB, permissions from code)

### What the Adapter Provides

- Full `PermisAdapter` implementation (read + write)
- Migration helpers compatible with `drizzle-kit`
- Query helpers: `findSubjectsWithPermission()`, `getPermissionTree()`, etc.
- Condition serialization: Stores ABAC conditions as JSON, rehydrates on read

---

## Better-Auth Adapter (`@permis/better-auth`)

### Mode 1: Plugin (Deep Integration)

```typescript
const auth = betterAuth({
  plugins: [permisPlugin({ roles, permissions, extendSchema: true })],
});
```

Provides:

- **Session enrichment** — user roles and permissions injected into session/JWT
- **Schema extension** — when `extendSchema: true`, adds permis tables to better-auth's DB
- **Hooks integration** — updates permis on role/org membership changes
- **Middleware** — `createGuard()` for route-level authorization
- **API methods** — `auth.api.permis.can()`, `auth.api.permis.authorize()`, `auth.api.getRoles()`

### Mode 2: Bridge (Standalone)

```typescript
const adapter = betterAuthBridge(auth, {
  roleResolver: (session) => [...derive roles from session],
  permissionResolver: (session) => [...derive permissions from session]
})
const permis = new PermisEngine({ adapter })
```

A thin read-only adapter that maps better-auth's data model to the `PermisAdapter` interface. No schema changes, no plugin registration — works alongside any existing better-auth setup.

---

## Package Structure

```
permis/
  packages/
    core/
      src/
        types.ts          # Subject, Resource, Action, Permission, Role, Context
        permission.ts     # definePermission() builder
        role.ts           # defineRole() builder
        engine.ts         # PermisEngine class
        resolver.ts       # RBAC + ABAC evaluation logic
        conditions.ts     # .when(), .where(), .having() implementations
        index.ts
      tests/
        engine.test.ts
        permission.test.ts
        role.test.ts
        resolver.test.ts

    drizzle/
      src/
        schema.ts         # createPermisSchema(), table definitions
        adapter.ts        # drizzleAdapter() factory
        queries.ts        # Query helpers
        serialization.ts  # Condition JSON serialization
        index.ts
      tests/
        schema.test.ts
        adapter.test.ts

    better-auth/
      src/
        plugin.ts         # permisPlugin() — better-auth plugin
        bridge.ts         # betterAuthBridge() — standalone adapter
        schema.ts         # Schema extensions
        guard.ts          # createGuard() middleware
        session.ts        # Session enrichment
        index.ts
      tests/
        plugin.test.ts
        bridge.test.ts
```

---

## Constraints

- **Core has zero runtime dependencies** — not even arktype at runtime
- **Isomorphic** — works in browser and server. No Node.js built-ins in core.
- **Standard-schema boundary** — the only schema dependency is the type-level `StandardSchemaV1` protocol
- **Peer dependencies for adapters** — drizzle-orm and better-auth are peer deps, not bundled
- **TypeScript 5+** with strict mode, ESM-only, `verbatimModuleSyntax`

---

## Out of Scope

- UI/admin panel for managing permissions
- Permission caching layers (can be built on top)
- Audit logging (can be added via adapter hooks)
- Graph-based permission resolution (ReBAC/Zanzibar-style)
- Permission inheritance or hierarchy beyond role-permission assignment
