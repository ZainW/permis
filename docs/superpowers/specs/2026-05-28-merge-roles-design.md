# mergeRoles + Adapter Composition — Design

## Overview

Two additions to permis: `mergeRoles()` as a pure function for role hierarchy, and adapter layering where the better-auth plugin can optionally wrap a drizzle adapter for data ownership.

---

## mergeRoles — Core Export

### API

```typescript
// @permis/core
function mergeRoles(name: string, ...parents: Role[]): Role;
```

A pure function that takes parent roles and produces a new role with all their permissions, deduplicated. No engine changes needed — roles are plain data, hierarchy is a transform applied before passing to the engine.

### Implementation

```typescript
export function mergeRoles(name: string, ...parents: Role[]): Role {
  const permissions = parents.flatMap((r) => r.permissions);
  const unique = permissions.filter(
    (p, i, arr) => arr.findIndex((q) => q.action === p.action && q.resource === p.resource) === i,
  );
  return { name, permissions };
}
```

~10 lines. Tree-shaken if unused.

### Usage Pattern

```typescript
const viewer = defineRole("viewer").with(readPost).build();
const editor = defineRole("editor").with(readPost, writePost).build();
const admin = mergeRoles("admin", editor, viewer);

const permis = new PermisEngine({ roles: [viewer, editor, admin] });
```

Roles are data. Hierarchy is a function. No builder changes, no engine changes, no circular reference risk.

### Behavior

- Permission deduplication: if two parent roles share a permission with the same `(action, resource)` pair, the **first occurrence** is kept (from the leftmost parent). Conditions are preserved as-is from that permission. No merging of conditions across parents.
- The merged role has its own name, independent of parent names
- Parents are not modified (immutable)
- If parents have no permissions, the merged role has `permissions: []`

---

## Adapter Layering — Better-Auth Wraps Drizzle

### Current State

`permisPlugin()` accepts `roles` and `permissions` directly. The plugin enriches better-auth sessions with permis data but does not connect to any storage adapter.

### New Behavior

`permisPlugin()` accepts an optional `adapter: PermisAdapter` parameter. When provided:

- The plugin constructs an internal `PermisEngine` using this adapter for `can()`/`authorize()` checks
- Session enrichment calls `adapter.getRolesForSubject()` and `adapter.getPermissionsForRole()` to populate session claims, rather than using only in-memory role definitions
- `extendSchema: true` adds permis tables to better-auth's DB schema — the adapter (e.g., drizzle) owns the actual table definitions and data, but the plugin tells better-auth to include those tables in its managed schema

When `adapter` is not provided:

- Plugin works as before (in-memory roles via `PermisEngine`, no persistence)

### Usage

```typescript
import { permisPlugin } from "@permis/better-auth";
import { createPermisSchema, drizzleAdapter } from "@permis/drizzle";

const schema = createPermisSchema();
const adapter = drizzleAdapter(db, schema);

const auth = betterAuth({
  plugins: [
    permisPlugin({
      roles: [viewer, editor, admin],
      adapter,
      extendSchema: true,
    }),
  ],
});
```

### Data Ownership

Drizzle owns the data (table definitions, storage). Better-auth surfaces it through auth sessions. The engine can be driven by either adapter at any given time — they don't need to coexist simultaneously.

---

## Multi-Adapter Coexistence

Only one adapter is active for the engine at a time. Schema generation (`createPermisSchema()`) and session enrichment (`permisPlugin()`) are independent from engine adapter selection. Users can:

1. Use `drizzleAdapter` for engine + `permisPlugin` for session enrichment (both wired to same DB)
2. Use `permisPlugin` with in-memory roles + `drizzleAdapter` for admin CRUD (separate concerns)
3. Use `betterAuthBridge` as a read-only engine adapter + `drizzleAdapter` for management

---

## What Changes

| Package               | Change                                            |
| --------------------- | ------------------------------------------------- |
| `@permis/core`        | New export: `mergeRoles(name, ...parents): Role`  |
| `@permis/better-auth` | `permisPlugin()` accepts optional `adapter` param |
| `@permis/drizzle`     | No changes                                        |

---

## Out of Scope

- Config file (`permis.config.ts`) — rejected in favor of plain TS
- Composite/multi-adapter engine — engine takes one adapter at a time
- Role hierarchy in the engine itself — hierarchy is a transform, not an engine concern
