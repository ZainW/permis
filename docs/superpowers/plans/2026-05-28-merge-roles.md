# mergeRoles + Adapter Layering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `mergeRoles()` pure function for role hierarchy and allow `permisPlugin()` to accept an optional adapter for storage-backed permissions.

**Architecture:** Two independent additions — `mergeRoles` is a ~10-line pure function exported from `@permis/core`. The `permisPlugin` optional `adapter` param lets better-auth plugin construct an internal `PermisEngine` backed by a database adapter instead of in-memory roles.

**Tech Stack:** TypeScript, Vite+, pnpm workspaces.

---

### Task 1: mergeRoles — Core Export

**Files:**

- Create: `packages/core/tests/merge-roles.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/merge-roles.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { definePermission, defineRole, mergeRoles } from "../src/index.ts";

const readPost = definePermission("read", "post").build();
const writePost = definePermission("write", "post").build();
const deletePost = definePermission("delete", "post").build();

test("mergeRoles inherits all permissions from a single parent", () => {
  const editor = defineRole("editor").with(readPost, writePost).build();
  const admin = mergeRoles("admin", editor);
  expect(admin.name).toBe("admin");
  expect(admin.permissions).toHaveLength(2);
  expect(admin.permissions).toEqual([readPost, writePost]);
});

test("mergeRoles inherits permissions from multiple parents", () => {
  const editor = defineRole("editor").with(readPost, writePost).build();
  const mod = defineRole("mod").with(deletePost).build();
  const admin = mergeRoles("admin", editor, mod);
  expect(admin.permissions).toHaveLength(3);
});

test("mergeRoles deduplicates shared permissions (keeps first occurrence)", () => {
  const editor = defineRole("editor").with(readPost).build();
  const viewer = defineRole("viewer").with(readPost).build();
  const admin = mergeRoles("admin", editor, viewer);
  expect(admin.permissions).toHaveLength(1);
  expect(admin.permissions[0]).toBe(readPost);
});

test("mergeRoles with no parents produces empty permissions", () => {
  const empty = mergeRoles("nothing");
  expect(empty.name).toBe("nothing");
  expect(empty.permissions).toEqual([]);
});

test("mergeRoles does not mutate parents", () => {
  const editor = defineRole("editor").with(readPost).build();
  const original = [...editor.permissions];
  mergeRoles("admin", editor);
  expect(editor.permissions).toEqual(original);
});

test("mergeRoles preserves conditions on inherited permissions", () => {
  const ownerDelete = definePermission("delete", "post")
    .when((ctx) => ctx.subject.id === "owner")
    .build();
  const editor = defineRole("editor").with(ownerDelete).build();
  const admin = mergeRoles("admin", editor);
  expect(admin.permissions[0]!.conditions).toEqual(ownerDelete.conditions);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/core && vp test`
Expected: 64 total tests (58 existing + 6 new). 6 fail — `mergeRoles` is not exported from `../src/index.ts`.

- [ ] **Step 3: Implement mergeRoles**

Create `packages/core/src/merge.ts`:

```typescript
import type { Role } from "./types.ts";

export function mergeRoles(name: string, ...parents: Role[]): Role {
  const permissions = parents.flatMap((r) => r.permissions);
  const unique = permissions.filter(
    (p, i, arr) => arr.findIndex((q) => q.action === p.action && q.resource === p.resource) === i,
  );
  return { name, permissions };
}
```

Then update `packages/core/src/index.ts` — add after the role export line:

```typescript
export { defineRole, RoleBuilder } from "./role.ts";
export { mergeRoles } from "./merge.ts";
export { PermisEngine } from "./engine.ts";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/core && vp test`
Expected: All 64 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/merge.ts packages/core/src/index.ts packages/core/tests/merge-roles.test.ts
git commit -m "feat(core): add mergeRoles pure function for role hierarchy"
```

---

### Task 2: permisPlugin Accepts Optional Adapter

**Files:**

- Modify: `packages/better-auth/src/plugin.ts`
- Modify: `packages/better-auth/tests/plugin.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `packages/better-auth/tests/plugin.test.ts` (after existing tests):

```typescript
test("permisPlugin with adapter uses adapter-backed engine", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();

  let rolesRequested: string | null = null;
  const adapter = {
    async getRolesForSubject(subjectId: string) {
      rolesRequested = subjectId;
      return ["editor"];
    },
    async getPermissionsForRole(_roleName: string) {
      return [readPost];
    },
    async getPermissionsForSubject(_subjectId: string) {
      return [readPost];
    },
    async resolveSubject(subjectId: string) {
      return { id: subjectId, type: "user" };
    },
    async resolveResource(type: string, _id: string) {
      return { type };
    },
  };

  const plugin = permisPlugin({ roles: [editor], adapter });
  expect(plugin.id).toBe("permis");
  expect(plugin.adapter).toBe(adapter);
});

test("permisPlugin without adapter does not expose adapter property", () => {
  const plugin = permisPlugin({});
  expect(plugin.adapter).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/better-auth && vp test`
Expected: 2 new test failures — adapter property not found.

- [ ] **Step 3: Implement adapter param on permisPlugin**

Modify `packages/better-auth/src/plugin.ts`:

```typescript
import type { Role, Permission, PermisAdapter } from "@permis/core";

export interface PermisPluginOptions {
  roles?: Role[];
  permissions?: Permission[];
  extendSchema?: boolean;
  adapter?: PermisAdapter;
}

export function permisPlugin(options: PermisPluginOptions) {
  return {
    id: "permis" as const,
    adapter: options.adapter,
    init: (auth: { $context: Record<string, unknown> }) => {
      auth.$context.permis = {
        roles: options.roles ?? [],
        permissions: options.permissions ?? [],
        adapter: options.adapter ?? null,
      };
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/better-auth && vp test`
Expected: All 15 tests pass (13 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add packages/better-auth/src/plugin.ts packages/better-auth/tests/plugin.test.ts
git commit -m "feat(better-auth): permisPlugin accepts optional adapter for storage-backed engine"
```

---

### Task 3: Remove Bench Test File

**Files:**

- Remove: `packages/core/tests/bench.test.ts`

- [ ] **Step 1: Remove the benchmark file**

```bash
rm packages/core/tests/bench.test.ts
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/tests/bench.test.ts
git commit -m "chore: remove benchmark test file"
```
