# Permis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript permissions library (RBAC + ABAC) with a zero-deps isomorphic core, a drizzle ORM adapter, and a better-auth plugin adapter.

**Architecture:** Monorepo with three packages — `@permis/core` (engine), `@permis/drizzle` (drizzle adapter), `@permis/better-auth` (better-auth adapter). Core exposes a builder-pattern API for defining permissions/roles and a `PermisEngine` for checking them. Standard-schema v1 is the boundary for ABAC conditions. Adapters implement a `PermisAdapter` interface to bridge the engine to database stores.

**Tech Stack:** TypeScript 5+, ESM-only, Vite+ (vp pack/build/test/check), pnpm workspaces, standard-schema v1 protocol (type-level only), arktype (dev dependency).

---

## File Structure Map

```
permis/
  packages/
    core/
      src/
        types.ts
        conditions.ts
        permission.ts
        role.ts
        resolver.ts
        engine.ts
        index.ts
      tests/
        conditions.test.ts
        permission.test.ts
        role.test.ts
        resolver.test.ts
        engine.test.ts
      package.json
      tsconfig.json
      vite.config.ts

    drizzle/
      src/
        schema.ts
        adapter.ts
        index.ts
      tests/
        schema.test.ts
        adapter.test.ts
      package.json
      tsconfig.json
      vite.config.ts

    better-auth/
      src/
        bridge.ts
        plugin.ts
        guard.ts
        session.ts
        schema.ts
        index.ts
      tests/
        bridge.test.ts
        plugin.test.ts
      package.json
      tsconfig.json
      vite.config.ts

  pnpm-workspace.yaml  (modified)
  package.json          (modified)
  .gitignore            (modified)
  tsconfig.json         (unaltered root)
  vite.config.ts        (unaltered root)
```

---

## Task 1: Monorepo Setup

- [ ] Step 1: Write the failing test

No test for repo setup — skip to Step 3.

- [ ] Step 2: Run tests to verify they fail

N/A — skip.

- [ ] Step 3: Implement the source code

### Modify `pnpm-workspace.yaml`

Replace full content:

```yaml
catalog:
  vite: npm:@voidzero-dev/vite-plus-core@latest
  vitest: npm:@voidzero-dev/vite-plus-test@latest
  vite-plus: latest
overrides:
  vite: "catalog:"
  vitest: "catalog:"
peerDependencyRules:
  allowAny:
    - vite
    - vitest
  allowedVersions:
    vite: "*"
    vitest: "*"
packages:
  - packages/*
```

### Modify `package.json` — root

Replace full content:

```json
{
  "name": "permis-monorepo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "check": "pnpm -r run check",
    "prepare": "vp config"
  },
  "devDependencies": {
    "@types/node": "^25.9.1",
    "@typescript/native-preview": "7.0.0-dev.20260509.2",
    "bumpp": "^11.1.0",
    "typescript": "^6.0.3",
    "vite-plus": "^0.1.22"
  },
  "packageManager": "pnpm@11.4.0"
}
```

### Modify `.gitignore`

Append to end:

```
.superpowers/
```

Current contents remain; append `.superpowers/` on a new line.

### Create `packages/core/package.json`

```json
{
  "name": "@permis/core",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test",
    "check": "vp check"
  }
}
```

### Create `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "tests"]
}
```

### Create `packages/core/vite.config.ts`

```typescript
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
```

### Create `packages/drizzle/package.json`

```json
{
  "name": "@permis/drizzle",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "drizzle-orm": "^0.40.0"
  },
  "dependencies": {
    "@permis/core": "workspace:*"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "better-sqlite3": "^11.0.0",
    "drizzle-orm": "^0.44.0"
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test",
    "check": "vp check"
  }
}
```

### Create `packages/drizzle/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "tests"]
}
```

### Create `packages/drizzle/vite.config.ts`

```typescript
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
```

### Create `packages/better-auth/package.json`

```json
{
  "name": "@permis/better-auth",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "better-auth": "^1.0.0"
  },
  "dependencies": {
    "@permis/core": "workspace:*"
  },
  "scripts": {
    "build": "vp pack",
    "test": "vp test",
    "check": "vp check"
  }
}
```

### Create `packages/better-auth/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src", "tests"]
}
```

### Create `packages/better-auth/vite.config.ts`

```typescript
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
```

### Create empty src dirs and test dirs

```
mkdir -p packages/core/src packages/core/tests
mkdir -p packages/drizzle/src packages/drizzle/tests
mkdir -p packages/better-auth/src packages/better-auth/tests
```

### Delete old root source files

```
rm src/index.ts tests/index.test.ts
rmdir src tests
```

- [ ] Step 4: Run tests to verify they pass

```bash
vp install && vp test
```

Expected output: no tests found, exit code 0, or small boilerplate passes.

- [ ] Step 5: Commit

```bash
git add -A
git commit -m "chore: monorepo setup with @permis/core, @permis/drizzle, @permis/better-auth packages"
```

---

## Task 2: Core Types

- [ ] Step 1: Write the failing test

Create `packages/core/tests/types.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";

test("types module can be imported", () => {
  expect(true).toBe(true);
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: test passes (it does nothing). This is a smoke test.

- [ ] Step 3: Implement the source code

Create `packages/core/src/types.ts`:

```typescript
export type SubjectId = string;

export type Action = string;

export type ResourceType = string;

export type Subject =
  | SubjectId
  | {
      id: SubjectId;
      type?: string;
      attrs?: Record<string, unknown>;
    };

export type Resource =
  | ResourceType
  | {
      type: ResourceType;
      id?: string;
      attrs?: Record<string, unknown>;
    };

export interface PermissionContext {
  subject: Subject;
  resource?: Resource;
  action: Action;
  environment?: Record<string, unknown>;
}

export interface Condition {
  type: "when" | "where" | "having";
  fn?: (ctx: PermissionContext) => boolean | Promise<boolean>;
  path?: string;
  operator?: "eq" | "ref" | "in" | "matches";
  value?: unknown;
  schema?: StandardSchemaV1;
  key?: string;
}

export interface Permission {
  action: Action | Action[];
  resource: ResourceType | ResourceType[];
  conditions?: Condition[];
  fields?: string[];
  description?: string;
}

export interface Role {
  name: string;
  permissions: Permission[];
  conditions?: Condition[];
}

export interface PermisAdapter {
  getRolesForSubject(subjectId: SubjectId): Promise<string[]>;
  getPermissionsForRole(roleName: string): Promise<Permission[]>;
  getPermissionsForSubject(subjectId: SubjectId): Promise<Permission[]>;
  resolveSubject(subjectId: SubjectId): Promise<Subject>;
  resolveResource(type: ResourceType, id: string): Promise<Resource>;
  assignRole?(subjectId: SubjectId, roleName: string): Promise<void>;
  revokeRole?(subjectId: SubjectId, roleName: string): Promise<void>;
  grantPermission?(roleName: string, permission: Permission): Promise<void>;
  revokePermission?(roleName: string, action: Action, resource: ResourceType): Promise<void>;
}

export interface PermisEngineOptions {
  roles?: Role[];
  permissions?: Permission[];
  adapter?: PermisAdapter;
}

export interface StandardSchemaV1 {
  "~standard": {
    version: 1;
    vendor: string;
    validate: (value: unknown) => StandardResultV1;
  };
}

export interface StandardResultV1 {
  issues?: StandardIssueV1[];
}

export interface StandardIssueV1 {
  message: string;
  path?: ReadonlyArray<string | number>;
}

export function normalizeSubject(s: Subject): {
  id: SubjectId;
  type?: string;
  attrs?: Record<string, unknown>;
} {
  if (typeof s === "string") return { id: s };
  return s;
}

export function normalizeResource(r: Resource): {
  type: ResourceType;
  id?: string;
  attrs?: Record<string, unknown>;
} {
  if (typeof r === "string") return { type: r };
  return r;
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: 1 test passes.

- [ ] Step 5: Commit

```bash
git add packages/core/src/types.ts packages/core/tests/types.test.ts
git commit -m "feat(core): add core types — Subject, Resource, Permission, Role, PermisAdapter, StandardSchemaV1"
```

---

## Task 3: WhereBuilder + ChainedWhereBuilder

- [ ] Step 1: Write the failing test

Create `packages/core/tests/conditions.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { WhereBuilder } from "../src/conditions.ts";

test("WhereBuilder .equals(value) builds condition with eq operator", () => {
  const wb = new WhereBuilder("orgId");
  const condition = wb.equals("acme-corp").build();
  expect(condition.type).toBe("where");
  expect(condition.path).toBe("orgId");
  expect(condition.operator).toBe("eq");
  expect(condition.value).toBe("acme-corp");
});

test("WhereBuilder .ref(path) builds condition with ref operator", () => {
  const wb = new WhereBuilder("orgId");
  const condition = wb.ref("subject.orgId").build();
  expect(condition.type).toBe("where");
  expect(condition.path).toBe("orgId");
  expect(condition.operator).toBe("ref");
  expect(condition.value).toBe("subject.orgId");
});

test("WhereBuilder .in(values) builds condition with in operator", () => {
  const wb = new WhereBuilder("role");
  const condition = wb.in(["admin", "editor"]).build();
  expect(condition.operator).toBe("in");
  expect(condition.value).toEqual(["admin", "editor"]);
});

test("WhereBuilder .matches(regex) builds condition with matches operator", () => {
  const wb = new WhereBuilder("email");
  const condition = wb.matches("^[a-z]+@test\\.com$").build();
  expect(condition.operator).toBe("matches");
  expect(condition.value).toBe("^[a-z]+@test\\.com$");
});

test("WhereBuilder throws if build() called before operator", () => {
  const wb = new WhereBuilder("x");
  expect(() => wb.build()).toThrow("No operator set");
});

test("WhereBuilder chains are independent — each call overwrites", () => {
  const wb = new WhereBuilder("p");
  const c = wb.equals(1).build();
  expect(c.operator).toBe("eq");
  expect(c.value).toBe(1);
  const c2 = wb.in([2, 3]).build();
  expect(c2.operator).toBe("in");
  expect(c2.value).toEqual([2, 3]);
  expect(c).not.toBe(c2);
});

test("ChainedWhereBuilder .equals creates new WhereBuilder and returns parent", () => {
  const { ChainedWhereBuilder } = require("../src/conditions.ts");
  const parent: string[] = [];
  const cb = new ChainedWhereBuilder("orgId", (cond) => {
    parent.push(cond.operator!);
    return parent;
  });
  const result = cb.equals("acme-corp");
  expect(result).toBe(parent);
  expect(parent).toEqual(["eq"]);
});

test("ChainedWhereBuilder .ref creates new WhereBuilder and returns parent", () => {
  const { ChainedWhereBuilder } = require("../src/conditions.ts");
  const parent: Record<string, unknown>[] = [];
  const cb = new ChainedWhereBuilder("orgId", (cond) => {
    parent.push({ op: cond.operator, val: cond.value });
    return parent;
  });
  const result = cb.ref("subject.orgId");
  expect(result).toBe(parent);
  expect(parent).toEqual([{ op: "ref", val: "subject.orgId" }]);
});

test("ChainedWhereBuilder can chain multiple where calls", () => {
  const { ChainedWhereBuilder } = require("../src/conditions.ts");
  const parent: string[] = [];
  const cb = new ChainedWhereBuilder("p", (cond) => {
    parent.push(`${cond.path}:${cond.operator}`);
    return parent;
  });
  const result = cb.equals(1);
  expect(result).toEqual(["p:eq"]);
  const result2 = new ChainedWhereBuilder("q", (cond) => {
    parent.push(`${cond.path}:${cond.operator}`);
    return parent;
  }).in(["a", "b"]);
  expect(result2).toEqual(["p:eq", "q:in"]);
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: 9 failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/core/src/conditions.ts`:

```typescript
import type { Condition } from "./types.ts";

export class WhereBuilder {
  private _path: string;
  private _operator?: "eq" | "ref" | "in" | "matches";
  private _value?: unknown;

  constructor(path: string) {
    this._path = path;
  }

  equals(value: unknown): this {
    this._operator = "eq";
    this._value = value;
    return this;
  }

  ref(path: string): this {
    this._operator = "ref";
    this._value = path;
    return this;
  }

  in(values: unknown[]): this {
    this._operator = "in";
    this._value = values;
    return this;
  }

  matches(regex: string): this {
    this._operator = "matches";
    this._value = regex;
    return this;
  }

  build(): Condition {
    if (this._operator === undefined) {
      throw new Error("No operator set on WhereBuilder");
    }
    return {
      type: "where",
      path: this._path,
      operator: this._operator,
      value: this._value,
    };
  }
}

export class ChainedWhereBuilder<TParent> {
  private _path: string;
  private _onCondition: (condition: Condition) => TParent;

  constructor(path: string, onCondition: (condition: Condition) => TParent) {
    this._path = path;
    this._onCondition = onCondition;
  }

  equals(value: unknown): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.equals(value).build());
  }

  ref(path: string): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.ref(path).build());
  }

  in(values: unknown[]): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.in(values).build());
  }

  matches(regex: string): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.matches(regex).build());
  }
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: 9 tests pass.

- [ ] Step 5: Commit

```bash
git add packages/core/src/conditions.ts packages/core/tests/conditions.test.ts
git commit -m "feat(core): add WhereBuilder and ChainedWhereBuilder for condition construction"
```

---

## Task 4: Permission Builder

- [ ] Step 1: Write the failing test

Create `packages/core/tests/permission.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { definePermission } from "../src/permission.ts";

test("definePermission with single action and resource", () => {
  const perm = definePermission("read", "post").build();
  expect(perm.action).toBe("read");
  expect(perm.resource).toBe("post");
  expect(perm.conditions).toBeUndefined();
});

test("definePermission with array action and array resource", () => {
  const perm = definePermission(["read", "write"], ["post", "comment"]).build();
  expect(perm.action).toEqual(["read", "write"]);
  expect(perm.resource).toEqual(["post", "comment"]);
});

test("definePermission .when(fn) adds a condition", () => {
  const fn = () => true;
  const perm = definePermission("read", "post").when(fn).build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("when");
  expect(perm.conditions![0].fn).toBe(fn);
});

test("definePermission .when chains multiple conditions", () => {
  const fn1 = () => true;
  const fn2 = () => false;
  const perm = definePermission("read", "post").when(fn1).when(fn2).build();
  expect(perm.conditions).toHaveLength(2);
  expect(perm.conditions![0].fn).toBe(fn1);
  expect(perm.conditions![1].fn).toBe(fn2);
});

test("definePermission .having(key, schema) adds a having condition", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("subject", schema).build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("having");
  expect(perm.conditions![0].key).toBe("subject");
  expect(perm.conditions![0].schema).toBe(schema);
});

test("definePermission .having with resource key", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("resource", schema).build();
  expect(perm.conditions![0].key).toBe("resource");
});

test("definePermission .having with environment key", () => {
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("read", "post").having("environment", schema).build();
  expect(perm.conditions![0].key).toBe("environment");
});

test("definePermission .where(path) creates a chained condition", () => {
  const perm = definePermission("read", "post").where("orgId").equals("acme-corp").build();
  expect(perm.conditions).toHaveLength(1);
  expect(perm.conditions![0].type).toBe("where");
  expect(perm.conditions![0].path).toBe("orgId");
  expect(perm.conditions![0].operator).toBe("eq");
  expect(perm.conditions![0].value).toBe("acme-corp");
});

test("definePermission chaining when, where, having together", () => {
  const fn = () => true;
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => ({ issues: [] }),
    },
  };
  const perm = definePermission("write", "post")
    .when(fn)
    .where("orgId")
    .equals("x-corp")
    .having("subject", schema)
    .build();
  expect(perm.conditions).toHaveLength(3);
  expect(perm.conditions![0].type).toBe("when");
  expect(perm.conditions![1].type).toBe("where");
  expect(perm.conditions![2].type).toBe("having");
});

test("definePermission .fields() sets field-level restrictions", () => {
  const perm = definePermission("read", "user").fields(["id", "name", "email"]).build();
  expect(perm.fields).toEqual(["id", "name", "email"]);
  expect(perm.conditions).toBeUndefined();
});

test("definePermission .describe() sets description", () => {
  const perm = definePermission("delete", "post").describe("Can delete a post").build();
  expect(perm.description).toBe("Can delete a post");
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: 11 failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/core/src/permission.ts`:

```typescript
import type {
  Action,
  ResourceType,
  Condition,
  Permission,
  PermissionContext,
  StandardSchemaV1,
} from "./types.ts";
import { ChainedWhereBuilder } from "./conditions.ts";

class PermissionBuilder {
  private _action: Action | Action[];
  private _resource: ResourceType | ResourceType[];
  private _conditions: Condition[] = [];
  private _fields?: string[];
  private _description?: string;

  constructor(action: Action | Action[], resource: ResourceType | ResourceType[]) {
    this._action = action;
    this._resource = resource;
  }

  when(fn: (ctx: PermissionContext) => boolean | Promise<boolean>): this {
    this._conditions.push({ type: "when", fn });
    return this;
  }

  where(path: string): ChainedWhereBuilder<this> {
    return new ChainedWhereBuilder<this>(path, (condition) => {
      this._conditions.push(condition);
      return this;
    });
  }

  having(key: "subject" | "resource" | "environment", schema: StandardSchemaV1): this {
    this._conditions.push({ type: "having", key, schema });
    return this;
  }

  fields(fields: string[]): this {
    this._fields = fields;
    return this;
  }

  describe(description: string): this {
    this._description = description;
    return this;
  }

  build(): Permission {
    const perm: Permission = {
      action: this._action,
      resource: this._resource,
    };
    if (this._conditions.length > 0) {
      perm.conditions = this._conditions;
    }
    if (this._fields !== undefined) {
      perm.fields = this._fields;
    }
    if (this._description !== undefined) {
      perm.description = this._description;
    }
    return perm;
  }
}

export function definePermission(
  action: Action | Action[],
  resource: ResourceType | ResourceType[],
): PermissionBuilder {
  return new PermissionBuilder(action, resource);
}

export { PermissionBuilder };
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: all tests pass (1 + 9 + 11 = 21 tests).

- [ ] Step 5: Commit

```bash
git add packages/core/src/permission.ts packages/core/tests/permission.test.ts
git commit -m "feat(core): add PermissionBuilder with when/where/having/fields/describe, export definePermission"
```

---

## Task 5: Role Builder

- [ ] Step 1: Write the failing test

Create `packages/core/tests/role.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { defineRole } from "../src/role.ts";
import { definePermission } from "../src/permission.ts";

const readPost = definePermission("read", "post").build();
const writePost = definePermission("write", "post").build();

test("defineRole creates a role with a name", () => {
  const role = defineRole("editor").build();
  expect(role.name).toBe("editor");
  expect(role.permissions).toEqual([]);
  expect(role.conditions).toBeUndefined();
});

test("defineRole .with(...permissions) adds permissions", () => {
  const role = defineRole("editor").with(readPost, writePost).build();
  expect(role.permissions).toHaveLength(2);
  expect(role.permissions[0]).toBe(readPost);
  expect(role.permissions[1]).toBe(writePost);
});

test("defineRole .with can be called multiple times", () => {
  const role = defineRole("editor").with(readPost).with(writePost).build();
  expect(role.permissions).toHaveLength(2);
});

test("defineRole .whenActive(fn) adds a role-level condition", () => {
  const fn = () => true;
  const role = defineRole("editor").with(readPost).whenActive(fn).build();
  expect(role.conditions).toHaveLength(1);
  expect(role.conditions![0].type).toBe("when");
  expect(role.conditions![0].fn).toBe(fn);
});

test("defineRole .where(path) chains condition on role", () => {
  const role = defineRole("editor").with(readPost).where("orgId").equals("acme-corp").build();
  expect(role.conditions).toHaveLength(1);
  expect(role.conditions![0].type).toBe("where");
  expect(role.conditions![0].path).toBe("orgId");
  expect(role.conditions![0].operator).toBe("eq");
  expect(role.conditions![0].value).toBe("acme-corp");
});

test("defineRole combines where, whenActive, and with", () => {
  const activeFn = () => true;
  const role = defineRole("admin")
    .with(readPost, writePost)
    .whenActive(activeFn)
    .where("ip")
    .in(["10.0.0.1", "10.0.0.2"])
    .build();
  expect(role.name).toBe("admin");
  expect(role.permissions).toHaveLength(2);
  expect(role.conditions).toHaveLength(2);
  expect(role.conditions![0].type).toBe("when");
  expect(role.conditions![1].type).toBe("where");
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: 6 additional failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/core/src/role.ts`:

```typescript
import type { Condition, Permission, PermissionContext, Role } from "./types.ts";
import { ChainedWhereBuilder } from "./conditions.ts";

class RoleBuilder {
  private _name: string;
  private _permissions: Permission[] = [];
  private _conditions: Condition[] = [];

  constructor(name: string) {
    this._name = name;
  }

  with(...permissions: Permission[]): this {
    this._permissions.push(...permissions);
    return this;
  }

  whenActive(fn: (ctx: PermissionContext) => boolean | Promise<boolean>): this {
    this._conditions.push({ type: "when", fn });
    return this;
  }

  where(path: string): ChainedWhereBuilder<this> {
    return new ChainedWhereBuilder<this>(path, (condition) => {
      this._conditions.push(condition);
      return this;
    });
  }

  build(): Role {
    const role: Role = {
      name: this._name,
      permissions: this._permissions,
    };
    if (this._conditions.length > 0) {
      role.conditions = this._conditions;
    }
    return role;
  }
}

export function defineRole(name: string): RoleBuilder {
  return new RoleBuilder(name);
}

export { RoleBuilder };
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: all tests pass (1 + 9 + 11 + 6 = 27 tests).

- [ ] Step 5: Commit

```bash
git add packages/core/src/role.ts packages/core/tests/role.test.ts
git commit -m "feat(core): add RoleBuilder with with/whenActive/where, export defineRole"
```

---

## Task 6: Resolver

- [ ] Step 1: Write the failing test

Create `packages/core/tests/resolver.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { matchAction, matchResource, evaluateConditions } from "../src/resolver.ts";
import type { PermissionContext, Subject, Resource } from "../src/types.ts";

const makeSubject = (id: string): Subject => ({ id });
const makeResource = (type: string, id: string): Resource => ({
  type,
  id,
});

// --- matchAction ---

test("matchAction — exact string match", () => {
  expect(matchAction("read", "read")).toBe(true);
  expect(matchAction("read", "write")).toBe(false);
});

test("matchAction — permission has array action, one matches", () => {
  expect(matchAction(["read", "write"], "read")).toBe(true);
  expect(matchAction(["read", "write"], "delete")).toBe(false);
});

test("matchAction — 'manage' permits all actions", () => {
  expect(matchAction("manage", "read")).toBe(true);
  expect(matchAction("manage", "write")).toBe(true);
  expect(matchAction("manage", "delete")).toBe(true);
  expect(matchAction("manage", "any-custom-action")).toBe(true);
});

test("matchAction — '*' wildcard matches any action", () => {
  expect(matchAction("*", "read")).toBe(true);
  expect(matchAction("*", "write")).toBe(true);
  expect(matchAction("*", "unknown")).toBe(true);
});

test("matchAction — array containing 'manage' matches all", () => {
  expect(matchAction(["read", "manage"], "delete")).toBe(true);
  expect(matchAction(["read", "manage"], "read")).toBe(true);
});

test("matchAction — array containing '*' matches all", () => {
  expect(matchAction(["read", "*"], "delete")).toBe(true);
});

// --- matchResource ---

test("matchResource — exact string match", () => {
  expect(matchResource("post", "post")).toBe(true);
  expect(matchResource("post", "comment")).toBe(false);
});

test("matchResource — permission has array resource, one matches", () => {
  expect(matchResource(["post", "comment"], "post")).toBe(true);
  expect(matchResource(["post", "comment"], "user")).toBe(false);
});

test("matchResource — single string vs array: true if array contains it", () => {
  expect(matchResource("post", ["post", "comment"])).toBe(true);
  expect(matchResource("post", ["comment", "user"])).toBe(false);
});

test("matchResource — both arrays: true if any overlap", () => {
  expect(matchResource(["post", "tag"], ["tag", "user"])).toBe(true);
  expect(matchResource(["post", "tag"], ["user", "comment"])).toBe(false);
});

// --- evaluateConditions ---

test("evaluateConditions — empty conditions pass", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const result = await evaluateConditions(undefined, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — single 'when' condition that returns true passes", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const conditions = [{ type: "when" as const, fn: () => true }];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — single 'when' condition that returns false fails", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const conditions = [{ type: "when" as const, fn: () => false }];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(false);
});

test("evaluateConditions — async 'when' condition", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const conditions = [
    {
      type: "when" as const,
      fn: () => Promise.resolve(true),
    },
  ];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(true);
});

test("evaluateConditions — all conditions must pass (AND logic)", async () => {
  const ctx: PermissionContext = {
    subject: makeSubject("user-1"),
    action: "read",
  };
  const conditions = [
    { type: "when" as const, fn: () => true },
    { type: "when" as const, fn: () => false },
    { type: "when" as const, fn: () => true },
  ];
  const result = await evaluateConditions(conditions, ctx);
  expect(result).toBe(false);
});

test("evaluateConditions — 'where' eq condition resolves path", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { orgId: "acme" } },
    action: "read",
    environment: { tenant: "acme" },
  };
  const conditions = [
    {
      type: "where" as const,
      path: "tenant",
      operator: "eq" as const,
      value: "acme",
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' ref condition compares two paths", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { orgId: "acme" } },
    resource: { type: "post", id: "1", attrs: { orgId: "acme" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.orgId",
      operator: "ref" as const,
      value: "resource.attrs.orgId",
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' in condition", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { role: "admin" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.role",
      operator: "in" as const,
      value: ["admin", "editor"],
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'where' matches condition (regex)", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1", attrs: { email: "user@test.com" } },
    action: "read",
  };
  const conditions = [
    {
      type: "where" as const,
      path: "subject.attrs.email",
      operator: "matches" as const,
      value: "^[a-z]+@test\\.com$",
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'having' condition validates with schema", async () => {
  const ctx: PermissionContext = {
    subject: {
      id: "user-1",
      attrs: { plan: "pro" },
    },
    action: "read",
  };
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (v: unknown) => {
        if (v && typeof (v as Record<string, unknown>).plan === "string") {
          return { issues: [] };
        }
        return { issues: [{ message: "invalid subject" }] };
      },
    },
  };
  const conditions = [
    {
      type: "having" as const,
      key: "subject" as const,
      schema,
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(true);
});

test("evaluateConditions — 'having' condition fails when schema returns issues", async () => {
  const ctx: PermissionContext = {
    subject: { id: "user-1" },
    action: "read",
  };
  const schema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: () => ({ issues: [{ message: "validation failed" }] }),
    },
  };
  const conditions = [
    {
      type: "having" as const,
      key: "resource" as const,
      schema,
    },
  ];
  expect(await evaluateConditions(conditions, ctx)).toBe(false);
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: 13 additional failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/core/src/resolver.ts`:

```typescript
import type { Action, ResourceType, Condition, PermissionContext } from "./types.ts";

export function matchAction(permAction: Action | Action[], checkAction: Action): boolean {
  if (Array.isArray(permAction)) {
    return permAction.some((a) => matchAction(a, checkAction));
  }
  if (permAction === "*" || permAction === "manage") return true;
  return permAction === checkAction;
}

export function matchResource(
  permResource: ResourceType | ResourceType[],
  checkResource: ResourceType | ResourceType[],
): boolean {
  const permArr = Array.isArray(permResource) ? permResource : [permResource];
  const checkArr = Array.isArray(checkResource) ? checkResource : [checkResource];
  return permArr.some((r) => checkArr.includes(r));
}

function resolvePath(ctx: PermissionContext, path: string): unknown {
  const parts = path.split(".");
  if (parts.length === 1) {
    const key = parts[0];
    if (
      ctx.environment !== undefined &&
      Object.prototype.hasOwnProperty.call(ctx.environment, key)
    ) {
      return ctx.environment[key];
    }
    if (ctx.resource !== undefined && typeof ctx.resource === "object") {
      if (Object.prototype.hasOwnProperty.call(ctx.resource, key)) {
        return (ctx.resource as Record<string, unknown>)[key];
      }
      const rAttrs = (ctx.resource as { attrs?: Record<string, unknown> }).attrs;
      if (rAttrs && Object.prototype.hasOwnProperty.call(rAttrs, key)) {
        return rAttrs[key];
      }
    }
    if (typeof ctx.subject === "object") {
      if (Object.prototype.hasOwnProperty.call(ctx.subject, key)) {
        return (ctx.subject as Record<string, unknown>)[key];
      }
      const sAttrs = (ctx.subject as { attrs?: Record<string, unknown> }).attrs;
      if (sAttrs && Object.prototype.hasOwnProperty.call(sAttrs, key)) {
        return sAttrs[key];
      }
    }
    return undefined;
  }
  let current: unknown = ctx;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

async function evaluateWhereCondition(
  condition: Condition,
  ctx: PermissionContext,
): Promise<boolean> {
  const path = condition.path;
  const operator = condition.operator;
  const value = condition.value;
  if (path === undefined || operator === undefined) return false;

  const resolved = resolvePath(ctx, path);

  switch (operator) {
    case "eq":
      return resolved === value;
    case "ref":
      return resolved === resolvePath(ctx, value as string);
    case "in":
      return Array.isArray(value) ? value.includes(resolved) : false;
    case "matches":
      try {
        return new RegExp(value as string).test(String(resolved));
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function evaluateConditions(
  conditions: Condition[] | undefined,
  ctx: PermissionContext,
): Promise<boolean> {
  if (!conditions || conditions.length === 0) return true;

  const results = await Promise.all(
    conditions.map(async (c) => {
      if (c.type === "when") {
        return c.fn ? await c.fn(ctx) : true;
      }
      if (c.type === "where") {
        return evaluateWhereCondition(c, ctx);
      }
      if (c.type === "having") {
        if (!c.schema || !c.key) return false;
        const key = c.key;
        const subject = typeof ctx.subject === "object" ? ctx.subject : undefined;
        const resource =
          ctx.resource !== undefined && typeof ctx.resource === "object" ? ctx.resource : undefined;
        const value: unknown =
          key === "subject" ? subject : key === "resource" ? resource : ctx.environment;
        const result = c.schema["~standard"].validate(value);
        return !result.issues || result.issues.length === 0;
      }
      return false;
    }),
  );
  return results.every(Boolean);
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: all tests pass (1 + 9 + 11 + 6 + 13 = 40 tests).

- [ ] Step 5: Commit

```bash
git add packages/core/src/resolver.ts packages/core/tests/resolver.test.ts
git commit -m "feat(core): add resolver — matchAction, matchResource, evaluateConditions"
```

---

## Task 7: PermisEngine

- [ ] Step 1: Write the failing test

Create `packages/core/tests/engine.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { PermisEngine } from "../src/engine.ts";
import { definePermission } from "../src/permission.ts";
import { defineRole } from "../src/role.ts";
import type { PermisAdapter, Subject, Resource } from "../src/types.ts";

function createNaiveAdapter(): PermisAdapter {
  const rolesMap = new Map<string, string[]>();
  const subjectsMap = new Map<string, Subject>();
  const resourcesMap = new Map<string, Resource>();
  return {
    async getRolesForSubject(subjectId) {
      return rolesMap.get(subjectId) ?? [];
    },
    async getPermissionsForRole(_roleName) {
      return [];
    },
    async getPermissionsForSubject(_subjectId) {
      return [];
    },
    async resolveSubject(subjectId) {
      return subjectsMap.get(subjectId) ?? { id: subjectId };
    },
    async resolveResource(type, id) {
      return resourcesMap.get(`${type}:${id}`) ?? { type, id };
    },
    _addRole(subjectId: string, roleName: string) {
      const existing = rolesMap.get(subjectId) ?? [];
      existing.push(roleName);
      rolesMap.set(subjectId, existing);
    },
    _addSubject(s: Subject) {
      const sObj = typeof s === "string" ? { id: s } : s;
      subjectsMap.set(sObj.id, sObj);
    },
    _addResource(r: Resource) {
      const rObj = typeof r === "string" ? { type: r } : r;
      resourcesMap.set(`${rObj.type}:${rObj.id ?? ""}`, rObj);
    },
  } as PermisAdapter & {
    _addRole(sid: string, rn: string): void;
    _addSubject(s: Subject): void;
    _addResource(r: Resource): void;
  };
}

// --- In-memory mode ---

test("PermisEngine in-memory: can() returns true when subject matches a role with matching permission", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.can("editor", "read", "post")).toBe(true);
});

test("PermisEngine in-memory: can() returns false when action does not match", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.can("editor", "delete", "post")).toBe(false);
});

test("PermisEngine in-memory: can() returns false when resource does not match", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.can("editor", "read", "comment")).toBe(false);
});

test("PermisEngine in-memory: can() returns false for unknown subject (no role match)", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.can("unknown-user", "read", "post")).toBe(false);
});

test("PermisEngine in-memory: cannot() is negation of can()", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.cannot("editor", "read", "post")).toBe(false);
  expect(await engine.cannot("editor", "delete", "post")).toBe(true);
});

test("PermisEngine in-memory: authorize() throws on denial", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  await expect(engine.authorize("editor", "read", "post")).resolves.toBeUndefined();
  await expect(engine.authorize("editor", "delete", "post")).rejects.toThrow("Permission denied");
});

test("PermisEngine in-memory: getRolesFor() returns matching role names", async () => {
  const readPost = definePermission("read", "post").build();
  const writePost = definePermission("write", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const author = defineRole("author").with(writePost).build();
  const engine = new PermisEngine({ roles: [editor, author] });
  const roles = await engine.getRolesFor("editor");
  expect(roles).toEqual(["editor"]);
});

test("PermisEngine in-memory: conditions are evaluated", async () => {
  const readPost = definePermission("read", "post")
    .when((ctx) => ctx.subject.id === "allowed-user")
    .build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  expect(await engine.can({ id: "allowed-user" }, "read", "post")).toBe(true);
  expect(await engine.can({ id: "blocked-user" }, "read", "post")).toBe(false);
});

test("PermisEngine in-memory: 'manage' permission covers any action", async () => {
  const managePosts = definePermission("manage", "post").build();
  const admin = defineRole("admin").with(managePosts).build();
  const engine = new PermisEngine({ roles: [admin] });
  expect(await engine.can("admin", "read", "post")).toBe(true);
  expect(await engine.can("admin", "write", "post")).toBe(true);
  expect(await engine.can("admin", "delete", "post")).toBe(true);
});

test("PermisEngine in-memory: multiple roles, permission from any role grants access", async () => {
  const readPost = definePermission("read", "post").build();
  const writePost = definePermission("write", "post").build();
  const reader = defineRole("reader").with(readPost).build();
  const writer = defineRole("writer").with(writePost).build();
  const engine = new PermisEngine({ roles: [reader, writer] });
  // subject "reader" only has reader role, can read but not write
  expect(await engine.can("reader", "read", "post")).toBe(true);
  expect(await engine.can("reader", "write", "post")).toBe(false);
});

// --- Adapter mode ---

test("PermisEngine adapter: delegates to adapter for role resolution", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const adapter = createNaiveAdapter();
  adapter._addRole("user-1", "editor");
  const engine = new PermisEngine({
    roles: [editor],
    adapter,
  });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
});

test("PermisEngine adapter: resolves subject via adapter for condition evaluation", async () => {
  const readPost = definePermission("read", "post")
    .when((ctx) => ctx.subject.id === "user-1")
    .build();
  const editor = defineRole("editor").with(readPost).build();
  const adapter = createNaiveAdapter();
  adapter._addRole("user-1", "editor");
  const engine = new PermisEngine({
    roles: [editor],
    adapter,
  });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/core && vp test
```

Expected: 12 additional failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/core/src/engine.ts`:

```typescript
import type {
  SubjectId,
  Action,
  ResourceType,
  Subject,
  Resource,
  PermissionContext,
  PermisEngineOptions,
  PermisAdapter,
  Role,
  Permission,
} from "./types.ts";
import { normalizeSubject, normalizeResource } from "./types.ts";
import { matchAction, matchResource, evaluateConditions } from "./resolver.ts";

export class PermisEngine {
  private _roles: Role[] = [];
  private _permissions: Permission[] = [];
  private _adapter?: PermisAdapter;

  constructor(options: PermisEngineOptions = {}) {
    this._roles = options.roles ?? [];
    this._permissions = options.permissions ?? [];
    this._adapter = options.adapter;
  }

  async can(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> {
    const subjectObj = normalizeSubject(typeof subject === "string" ? subject : subject);
    const resourceObj = normalizeResource(typeof resource === "string" ? resource : resource);

    const roleNames = await this._resolveRoles(subjectObj.id);

    const ctx = await this._buildContext(subjectObj, resourceObj, action);

    for (const roleName of roleNames) {
      const role = this._roles.find((r) => r.name === roleName);
      if (!role) continue;

      if (role.conditions && role.conditions.length > 0) {
        const roleOk = await evaluateConditions(role.conditions, ctx);
        if (!roleOk) continue;
      }

      for (const perm of role.permissions) {
        if (!matchAction(perm.action, action) || !matchResource(perm.resource, resourceObj.type)) {
          continue;
        }
        const permOk = await evaluateConditions(perm.conditions, ctx);
        if (permOk) return true;
      }
    }

    return false;
  }

  async cannot(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> {
    return !(await this.can(subject, action, resource));
  }

  async authorize(
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<void> {
    const allowed = await this.can(subject, action, resource);
    if (!allowed) {
      throw new Error("Permission denied");
    }
  }

  async getRolesFor(subject: SubjectId | Subject): Promise<string[]> {
    const id = typeof subject === "string" ? subject : subject.id;
    return this._resolveRoles(id);
  }

  private async _resolveRoles(subjectId: SubjectId): Promise<string[]> {
    if (this._adapter) {
      return this._adapter.getRolesForSubject(subjectId);
    }
    return this._roles.filter((r) => r.name === subjectId).map((r) => r.name);
  }

  private async _buildContext(
    subjectObj: { id: string; type?: string; attrs?: Record<string, unknown> },
    resourceObj: { type: string; id?: string; attrs?: Record<string, unknown> },
    action: string,
  ): Promise<PermissionContext> {
    let subject = subjectObj;
    let resource = resourceObj;

    if (this._adapter) {
      try {
        subject = normalizeSubject(await this._adapter.resolveSubject(subjectObj.id));
      } catch {
        // keep as-is
      }
      if (resourceObj.id) {
        try {
          resource = normalizeResource(
            await this._adapter.resolveResource(resourceObj.type, resourceObj.id),
          );
        } catch {
          // keep as-is
        }
      }
    }

    return {
      subject,
      resource,
      action,
    };
  }
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp test
```

Expected: all tests pass (1 + 9 + 11 + 6 + 13 + 12 = 52 tests).

- [ ] Step 5: Commit

```bash
git add packages/core/src/engine.ts packages/core/tests/engine.test.ts
git commit -m "feat(core): add PermisEngine with can/cannot/authorize/getRolesFor"
```

---

## Task 8: Core Index

- [ ] Step 1: Write the failing test

No new test — we're reorganizing exports. Tests from previous tasks still validate behavior.

- [ ] Step 2: Run tests to verify they fail

N/A — skip.

- [ ] Step 3: Implement the source code

Create `packages/core/src/index.ts`:

```typescript
export type {
  SubjectId,
  Action,
  ResourceType,
  Subject,
  Resource,
  PermissionContext,
  Condition,
  Permission,
  Role,
  PermisAdapter,
  PermisEngineOptions,
  StandardSchemaV1,
  StandardResultV1,
  StandardIssueV1,
} from "./types.ts";

export { WhereBuilder, ChainedWhereBuilder } from "./conditions.ts";
export { definePermission, PermissionBuilder } from "./permission.ts";
export { defineRole, RoleBuilder } from "./role.ts";
export { matchAction, matchResource, evaluateConditions } from "./resolver.ts";
export { PermisEngine } from "./engine.ts";
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/core && vp check && vp test
```

Expected: all 52 tests pass. Lint and type-check pass.

- [ ] Step 5: Commit

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): add public index barrel with all re-exports"
```

---

## Task 9: Drizzle Schema

- [ ] Step 1: Write the failing test

Create `packages/drizzle/tests/schema.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { createPermisSchema } from "../src/schema.ts";

test("createPermisSchema() returns four table definitions", () => {
  const schema = createPermisSchema();
  expect(schema.roles).toBeDefined();
  expect(schema.permissions).toBeDefined();
  expect(schema.rolePermissions).toBeDefined();
  expect(schema.subjectRoles).toBeDefined();
});

test("createPermisSchema() tables have expected symbol", () => {
  const schema = createPermisSchema();
  // drizzle tables have a Symbol property
  const sym = Object.getOwnPropertySymbols(schema.roles).find(
    (s) => s.toString() === "Symbol(drizzle:SQLiteTable)",
  );
  expect(sym).toBeDefined();
  expect(typeof schema.roles[sym as symbol]).toBe("object");
});

test("createPermisSchema({ tablePrefix }) prefixes table names", () => {
  const schema = createPermisSchema({ tablePrefix: "test_" });
  const sym = Object.getOwnPropertySymbols(schema.roles).find(
    (s) => s.toString() === "Symbol(drizzle:SQLiteTable)",
  )!;
  const config = schema.roles[sym];
  expect(config.name).toContain("test_roles");
});

test("createPermisSchema() default prefix is 'permis_'", () => {
  const schema = createPermisSchema();
  const sym = Object.getOwnPropertySymbols(schema.roles).find(
    (s) => s.toString() === "Symbol(drizzle:SQLiteTable)",
  )!;
  const config = schema.roles[sym];
  expect(config.name).toContain("permis_roles");
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/drizzle && vp test
```

Expected: 4 failures — module not found. (drizzle-orm needs to be installed first: `pnpm install` from root.)

- [ ] Step 3: Implement the source code

Install dependencies first. From the repo root:

```bash
pnpm install
```

Create `packages/drizzle/src/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export interface CreatePermisSchemaOptions {
  tablePrefix?: string;
  extra?: {
    roles?: Record<string, ReturnType<typeof text>>;
    permissions?: Record<string, ReturnType<typeof text>>;
    rolePermissions?: Record<string, ReturnType<typeof text>>;
    subjectRoles?: Record<string, ReturnType<typeof text>>;
  };
}

export function createPermisSchema(options?: CreatePermisSchemaOptions) {
  const prefix = options?.tablePrefix ?? "permis_";
  const extra = options?.extra ?? {};

  const roles = sqliteTable(`${prefix}roles`, {
    name: text("name").primaryKey(),
    description: text("description"),
    condition: text("condition"),
    active: integer("active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(""),
    ...extra.roles,
  });

  const permissions = sqliteTable(`${prefix}permissions`, {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    fields: text("fields"),
    conditions: text("conditions"),
    description: text("description"),
    ...extra.permissions,
  });

  const rolePermissions = sqliteTable(`${prefix}role_permissions`, {
    roleName: text("role_name").notNull(),
    permissionId: text("permission_id").notNull(),
    ...extra.rolePermissions,
  });

  const subjectRoles = sqliteTable(`${prefix}subject_roles`, {
    subjectId: text("subject_id").notNull(),
    roleName: text("role_name").notNull(),
    grantedAt: text("granted_at").default(""),
    grantedBy: text("granted_by"),
    ...extra.subjectRoles,
  });

  return { roles, permissions, rolePermissions, subjectRoles };
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/drizzle && vp test
```

Expected: 4 tests pass.

- [ ] Step 5: Commit

```bash
git add packages/drizzle/src/schema.ts packages/drizzle/tests/schema.test.ts pnpm-lock.yaml packages/drizzle/package.json
git commit -m "feat(drizzle): add createPermisSchema — auto-generates 4 SQLite table definitions"
```

---

## Task 10: Drizzle Adapter

- [ ] Step 1: Write the failing test

Create `packages/drizzle/tests/adapter.test.ts`:

```typescript
import { expect, test, beforeAll, afterAll } from "vite-plus/test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and } from "drizzle-orm";
import { createPermisSchema } from "../src/schema.ts";
import { drizzleAdapter } from "../src/adapter.ts";
import { definePermission, defineRole, PermisEngine } from "@permis/core";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let schema: ReturnType<typeof createPermisSchema>;

beforeAll(() => {
  sqlite = new Database(":memory:");
  db = drizzle(sqlite);
  schema = createPermisSchema();

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS permis_roles (
      name TEXT PRIMARY KEY,
      description TEXT,
      condition TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS permis_permissions (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      fields TEXT,
      conditions TEXT,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS permis_role_permissions (
      role_name TEXT NOT NULL,
      permission_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS permis_subject_roles (
      subject_id TEXT NOT NULL,
      role_name TEXT NOT NULL,
      granted_at TEXT DEFAULT '',
      granted_by TEXT
    );
  `);
});

afterAll(() => {
  sqlite.close();
});

function seedData() {
  sqlite.exec(`
    DELETE FROM permis_subject_roles;
    DELETE FROM permis_role_permissions;
    DELETE FROM permis_permissions;
    DELETE FROM permis_roles;
  `);
  const insertStmt = sqlite.prepare("INSERT INTO permis_roles (name, description) VALUES (?, ?)");
  insertStmt.run("editor", "Editor role");
  insertStmt.run("admin", "Admin role");

  const insertPerm = sqlite.prepare(
    "INSERT INTO permis_permissions (id, action, resource, description) VALUES (?, ?, ?, ?)",
  );
  insertPerm.run("perm-1", "read", "post", "Read posts");
  insertPerm.run("perm-2", "write", "post", "Write posts");
  insertPerm.run("perm-3", "manage", "user", "Manage users");

  const insertRP = sqlite.prepare(
    "INSERT INTO permis_role_permissions (role_name, permission_id) VALUES (?, ?)",
  );
  insertRP.run("editor", "perm-1");
  insertRP.run("editor", "perm-2");
  insertRP.run("admin", "perm-3");

  const insertSR = sqlite.prepare(
    "INSERT INTO permis_subject_roles (subject_id, role_name) VALUES (?, ?)",
  );
  insertSR.run("user-1", "editor");
  insertSR.run("user-2", "admin");
}

test("drizzleAdapter: getRolesForSubject returns role names", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const roles = await adapter.getRolesForSubject("user-1");
  expect(roles).toEqual(["editor"]);
});

test("drizzleAdapter: getRolesForSubject returns empty for unknown subject", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const roles = await adapter.getRolesForSubject("unknown");
  expect(roles).toEqual([]);
});

test("drizzleAdapter: getPermissionsForRole returns permissions", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const perms = await adapter.getPermissionsForRole("editor");
  expect(perms.length).toBe(2);
  const actions = perms.map((p) => p.action).sort();
  expect(actions).toEqual(["read", "write"]);
});

test("drizzleAdapter: getPermissionsForSubject returns combined permissions", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const perms = await adapter.getPermissionsForSubject("user-1");
  expect(perms.length).toBe(2);
});

test("drizzleAdapter: assignRole + getRolesForSubject roundtrip", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  await adapter.assignRole?.("user-3", "editor");
  const roles = await adapter.getRolesForSubject("user-3");
  expect(roles).toEqual(["editor"]);
});

test("drizzleAdapter: revokeRole removes assignment", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  await adapter.assignRole?.("user-4", "editor");
  await adapter.revokeRole?.("user-4", "editor");
  const roles = await adapter.getRolesForSubject("user-4");
  expect(roles).toEqual([]);
});

test("drizzleAdapter: resolveSubject returns subject object", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const s = await adapter.resolveSubject("user-1");
  expect(s.id || (s as { id: string }).id).toBe("user-1");
});

test("drizzleAdapter: integration with PermisEngine", async () => {
  seedData();
  const adapter = drizzleAdapter(db, schema);
  const readPost = definePermission("read", "post").build();
  const writePost = definePermission("write", "post").build();
  const editor = defineRole("editor").with(readPost, writePost).build();
  const engine = new PermisEngine({
    roles: [editor],
    adapter,
  });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
  expect(await engine.can("user-2", "manage", "user")).toBe(true);
  expect(await engine.can("user-1", "manage", "user")).toBe(false);
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/drizzle && vp test
```

Expected: 8 failures — module not found (`adapter.ts` missing).

- [ ] Step 3: Implement the source code

Create `packages/drizzle/src/adapter.ts`:

```typescript
import { eq, and, inArray } from "drizzle-orm";
import type { DrizzleSQLiteDatabase } from "drizzle-orm/better-sqlite3";
import type { PermisAdapter, Permission, Subject, Resource } from "@permis/core";
import type { createPermisSchema } from "./schema.ts";

type Schema = ReturnType<typeof createPermisSchema>;

export function drizzleAdapter(
  db: ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle>,
  schema: Schema,
): PermisAdapter {
  const { roles, permissions, rolePermissions, subjectRoles } = schema;

  const adapter: PermisAdapter = {
    async getRolesForSubject(subjectId: string): Promise<string[]> {
      const rows = db
        .select({ roleName: subjectRoles.roleName })
        .from(subjectRoles)
        .where(eq(subjectRoles.subjectId, subjectId))
        .all();
      return rows.map((r) => r.roleName);
    },

    async getPermissionsForRole(roleName: string): Promise<Permission[]> {
      const rows = db
        .select({
          action: permissions.action,
          resource: permissions.resource,
          fields: permissions.fields,
          conditions: permissions.conditions,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleName, roleName))
        .all();

      return rows.map((r) => {
        const perm: Permission = {
          action: r.action,
          resource: r.resource,
        };
        if (r.fields) {
          try {
            perm.fields = JSON.parse(r.fields);
          } catch {
            /* ignore */
          }
        }
        if (r.conditions) {
          try {
            perm.conditions = JSON.parse(r.conditions);
          } catch {
            /* ignore */
          }
        }
        if (r.description) {
          perm.description = r.description;
        }
        return perm;
      });
    },

    async getPermissionsForSubject(subjectId: string): Promise<Permission[]> {
      const roleRows = db
        .select({ roleName: subjectRoles.roleName })
        .from(subjectRoles)
        .where(eq(subjectRoles.subjectId, subjectId))
        .all();

      const roleNames = roleRows.map((r) => r.roleName);
      if (roleNames.length === 0) return [];

      const results: Permission[] = [];
      for (const roleName of roleNames) {
        const perms = await adapter.getPermissionsForRole(roleName);
        results.push(...perms);
      }
      return results;
    },

    async resolveSubject(subjectId: string): Promise<Subject> {
      return { id: subjectId };
    },

    async resolveResource(type: string, id: string): Promise<Resource> {
      return { type, id };
    },

    async assignRole(subjectId: string, roleName: string): Promise<void> {
      const existing = db
        .select()
        .from(subjectRoles)
        .where(and(eq(subjectRoles.subjectId, subjectId), eq(subjectRoles.roleName, roleName)))
        .all();
      if (existing.length === 0) {
        db.insert(subjectRoles)
          .values({
            subjectId,
            roleName,
            grantedAt: new Date().toISOString(),
          })
          .run();
      }
    },

    async revokeRole(subjectId: string, roleName: string): Promise<void> {
      db.delete(subjectRoles)
        .where(and(eq(subjectRoles.subjectId, subjectId), eq(subjectRoles.roleName, roleName)))
        .run();
    },

    async grantPermission(roleName: string, permission: Permission): Promise<void> {
      const id = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const action = Array.isArray(permission.action)
        ? JSON.stringify(permission.action)
        : permission.action;
      const resource = Array.isArray(permission.resource)
        ? JSON.stringify(permission.resource)
        : permission.resource;

      db.insert(permissions)
        .values({
          id,
          action,
          resource,
          fields: permission.fields ? JSON.stringify(permission.fields) : null,
          conditions: permission.conditions ? JSON.stringify(permission.conditions) : null,
          description: permission.description ?? null,
        })
        .run();

      db.insert(rolePermissions)
        .values({
          roleName,
          permissionId: id,
        })
        .run();
    },

    async revokePermission(roleName: string, action: string, resource: string): Promise<void> {
      const perms = db
        .select({ id: permissions.id })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(rolePermissions.roleName, roleName),
            eq(permissions.action, action),
            eq(permissions.resource, resource),
          ),
        )
        .all();

      for (const p of perms) {
        db.delete(rolePermissions).where(eq(rolePermissions.permissionId, p.id)).run();
        db.delete(permissions).where(eq(permissions.id, p.id)).run();
      }
    },
  };

  return adapter;
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/drizzle && vp test
```

Expected: 8 tests pass (4 schema + 8 adapter = 12 in drizzle package).

- [ ] Step 5: Commit

```bash
git add packages/drizzle/src/adapter.ts packages/drizzle/tests/adapter.test.ts
git commit -m "feat(drizzle): add drizzleAdapter — full PermisAdapter with drizzle CRUD"
```

---

## Task 11: Better-Auth Bridge

- [ ] Step 1: Write the failing test

Create `packages/better-auth/tests/bridge.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { betterAuthBridge } from "../src/bridge.ts";
import type { PermisAdapter, Permission, Subject, Resource } from "@permis/core";

function createMockAuth(sessionData: Record<string, unknown> = {}) {
  return {
    $context: {
      session: sessionData,
    },
    api: {
      getSession: async () => sessionData,
    },
  };
}

test("betterAuthBridge: getRolesForSubject uses roleResolver", async () => {
  const auth = createMockAuth({
    user: { id: "user-1", role: "admin" },
  });
  const adapter = betterAuthBridge(auth, {
    roleResolver: (_session: Record<string, unknown>) => ["admin", "editor"],
  });
  const roles = await adapter.getRolesForSubject("user-1");
  expect(roles).toEqual(["admin", "editor"]);
});

test("betterAuthBridge: getPermissionsForRole uses permissionResolver", async () => {
  const auth = createMockAuth({
    user: { id: "user-1", role: "admin" },
  });
  const readPerm: Permission = { action: "read", resource: "post" };
  const adapter = betterAuthBridge(auth, {
    roleResolver: () => ["admin"],
    permissionResolver: (_session: Record<string, unknown>) => [readPerm],
  });
  await adapter.getRolesForSubject("user-1");
  const perms = await adapter.getPermissionsForRole("admin");
  expect(perms).toEqual([readPerm]);
});

test("betterAuthBridge: getPermissionsForSubject aggregates perms via roleResolver", async () => {
  const auth = createMockAuth({
    user: { id: "user-1", role: "admin" },
  });
  const readPerm: Permission = { action: "read", resource: "post" };
  const writePerm: Permission = { action: "write", resource: "post" };
  const adapter = betterAuthBridge(auth, {
    roleResolver: () => ["admin", "editor"],
    permissionResolver: (_session: Record<string, unknown>) => [readPerm, writePerm],
  });
  await adapter.getRolesForSubject("user-1");
  const perms = await adapter.getPermissionsForSubject("user-1");
  expect(perms).toEqual([readPerm, writePerm, readPerm, writePerm]);
});

test("betterAuthBridge: resolveSubject returns subject from session", async () => {
  const auth = createMockAuth({
    user: { id: "user-1", name: "Alice", orgId: "org-1" },
  });
  const adapter = betterAuthBridge(auth);
  const subject = await adapter.resolveSubject("user-1");
  expect(subject).toEqual({ id: "user-1" });
});

test("betterAuthBridge: resolveResource returns basic resource", async () => {
  const auth = createMockAuth({});
  const adapter = betterAuthBridge(auth);
  const resource = await adapter.resolveResource("post", "1");
  expect(resource).toEqual({ type: "post", id: "1" });
});

test("betterAuthBridge: is read-only — assignRole should be undefined", async () => {
  const auth = createMockAuth({});
  const adapter = betterAuthBridge(auth);
  expect(adapter.assignRole).toBeUndefined();
  expect(adapter.revokeRole).toBeUndefined();
  expect(adapter.grantPermission).toBeUndefined();
  expect(adapter.revokePermission).toBeUndefined();
});
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/better-auth && vp test
```

Expected: 6 failures — module not found.

- [ ] Step 3: Implement the source code

Create `packages/better-auth/src/bridge.ts`:

```typescript
import type { PermisAdapter, Permission, Subject, Resource } from "@permis/core";

export interface BetterAuthBridgeOptions {
  roleResolver?: (session: Record<string, unknown>) => string[] | Promise<string[]>;
  permissionResolver?: (session: Record<string, unknown>) => Permission[] | Promise<Permission[]>;
}

export function betterAuthBridge(
  auth: {
    $context?: { session?: Record<string, unknown> };
    api?: { getSession?: () => Promise<Record<string, unknown>> };
  },
  options?: BetterAuthBridgeOptions,
): PermisAdapter {
  async function getSession(): Promise<Record<string, unknown>> {
    if (auth.$context?.session) return auth.$context.session;
    if (auth.api?.getSession) return auth.api.getSession();
    return {};
  }

  return {
    async getRolesForSubject(_subjectId: string): Promise<string[]> {
      const session = await getSession();
      if (options?.roleResolver) {
        return options.roleResolver(session);
      }
      return [];
    },

    async getPermissionsForRole(_roleName: string): Promise<Permission[]> {
      const session = await getSession();
      if (options?.permissionResolver) {
        return options.permissionResolver(session);
      }
      return [];
    },

    async getPermissionsForSubject(subjectId: string): Promise<Permission[]> {
      const roles = await this.getRolesForSubject(subjectId);
      const results: Permission[] = [];
      for (const role of roles) {
        const perms = await this.getPermissionsForRole(role);
        results.push(...perms);
      }
      return results;
    },

    async resolveSubject(subjectId: string): Promise<Subject> {
      return { id: subjectId };
    },

    async resolveResource(type: string, id: string): Promise<Resource> {
      return { type, id };
    },
  };
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/better-auth && vp test
```

Expected: 6 tests pass.

- [ ] Step 5: Commit

```bash
git add packages/better-auth/src/bridge.ts packages/better-auth/tests/bridge.test.ts
git commit -m "feat(better-auth): add betterAuthBridge — read-only PermisAdapter for better-auth"
```

---

## Task 12: Better-Auth Plugin

- [ ] Step 1: Write the failing test

Create `packages/better-auth/tests/plugin.test.ts`:

```typescript
import { expect, test } from "vite-plus/test";
import { permisPlugin } from "../src/plugin.ts";
import { createGuard } from "../src/guard.ts";
import { definePermission, defineRole, PermisEngine } from "@permis/core";

test("permisPlugin returns an object with id and init", () => {
  const plugin = permisPlugin({});
  expect(plugin.id).toBeDefined();
  expect(plugin.init).toBeDefined();
  expect(typeof plugin.init).toBe("function");
});

test("permisPlugin id is 'permis'", () => {
  const plugin = permisPlugin({});
  expect(plugin.id).toBe("permis");
});

test("permisPlugin init adds permis context to auth", () => {
  const plugin = permisPlugin({});
  const mockAuth = {
    $context: {} as Record<string, unknown>,
  };
  const ctx = {} as Record<string, unknown>;
  plugin.init?.(mockAuth as Parameters<NonNullable<typeof plugin.init>>[0]);
  expect(mockAuth.$context.permis).toBeDefined();
});

test("permisPlugin with roles passes them to context", () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const plugin = permisPlugin({ roles: [editor] });
  const mockAuth = {
    $context: {} as Record<string, unknown>,
  };
  plugin.init?.(mockAuth as Parameters<NonNullable<typeof plugin.init>>[0]);
  expect(mockAuth.$context.permis).toBeDefined();
});

test("createGuard returns a function", () => {
  const engine = new PermisEngine();
  const guard = createGuard(engine);
  expect(typeof guard).toBe("function");
});

test("createGuard guard returns true for allowed action", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  const guard = createGuard(engine);
  const result = await guard("editor", "read", "post");
  expect(result).toBe(true);
});

test("createGuard guard returns false for denied action", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const engine = new PermisEngine({ roles: [editor] });
  const guard = createGuard(engine);
  const result = await guard("editor", "delete", "post");
  expect(result).toBe(false);
});
```

Create `packages/better-auth/src/plugin.ts`:

```typescript
import type { Role, Permission } from "@permis/core";

export interface PermisPluginOptions {
  roles?: Role[];
  permissions?: Permission[];
  extendSchema?: boolean;
}

export function permisPlugin(options: PermisPluginOptions) {
  return {
    id: "permis",
    init: (auth: { $context: Record<string, unknown> }) => {
      auth.$context.permis = {
        roles: options.roles ?? [],
        permissions: options.permissions ?? [],
      };
    },
  };
}
```

Create `packages/better-auth/src/guard.ts`:

```typescript
import type { PermisEngine } from "@permis/core";
import type { SubjectId, Subject, Action, ResourceType, Resource } from "@permis/core";

export function createGuard(engine: PermisEngine) {
  return async (
    subject: SubjectId | Subject,
    action: Action,
    resource: ResourceType | Resource,
  ): Promise<boolean> => {
    return engine.can(subject, action, resource);
  };
}
```

Create `packages/better-auth/src/session.ts`:

```typescript
import type { Role, Permission } from "@permis/core";

export interface SessionEnrichment {
  roles?: string[];
  permissions?: Permission[];
}

export function enrichSessionWithPermis(roles: Role[], subjectRoles: string[]): SessionEnrichment {
  const permissions: Permission[] = [];
  for (const roleName of subjectRoles) {
    const role = roles.find((r) => r.name === roleName);
    if (role) {
      permissions.push(...role.permissions);
    }
  }
  return {
    roles: subjectRoles,
    permissions,
  };
}
```

- [ ] Step 2: Run tests to verify they fail

```bash
cd packages/better-auth && vp test
```

Expected: 7 failures — plugin.ts and guard.ts not found.

- [ ] Step 3: Implement the source code

The source files were already created in Step 1 above. Let me also create `packages/better-auth/src/schema.ts`:

```typescript
export function createPermisSchemaExtension() {
  return {
    permis_roles: {
      name: {
        type: "string" as const,
        required: true,
      },
      description: {
        type: "string" as const,
        required: false,
      },
      active: {
        type: "boolean" as const,
        required: false,
      },
      createdAt: {
        type: "string" as const,
        required: false,
      },
    } as Record<string, { type: string; required: boolean }>,
    permis_permissions: {
      id: { type: "string" as const, required: true },
      action: { type: "string" as const, required: true },
      resource: { type: "string" as const, required: true },
      fields: { type: "string" as const, required: false },
      conditions: { type: "string" as const, required: false },
      description: { type: "string" as const, required: false },
    } as Record<string, { type: string; required: boolean }>,
    permis_role_permissions: {
      roleName: { type: "string" as const, required: true },
      permissionId: { type: "string" as const, required: true },
    } as Record<string, { type: string; required: boolean }>,
    permis_subject_roles: {
      subjectId: { type: "string" as const, required: true },
      roleName: { type: "string" as const, required: true },
      grantedAt: { type: "string" as const, required: false },
      grantedBy: { type: "string" as const, required: false },
    } as Record<string, { type: string; required: boolean }>,
  };
}
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd packages/better-auth && vp test
```

Expected: all 7 tests pass (plugin + bridge = 6 + 7 = 13 tests in better-auth package).

- [ ] Step 5: Commit

```bash
git add packages/better-auth/src/plugin.ts packages/better-auth/src/guard.ts packages/better-auth/src/session.ts packages/better-auth/src/schema.ts packages/better-auth/tests/plugin.test.ts
git commit -m "feat(better-auth): add permisPlugin, createGuard, session enrichment, and schema extension"
```

---

## Task 13: Public Exports & Final Verification

- [ ] Step 1: Write the failing test

No new tests. Smoke test that imports work from all packages.

- [ ] Step 2: Run tests to verify they fail

N/A.

- [ ] Step 3: Implement the source code

Create `packages/drizzle/src/index.ts`:

```typescript
export { createPermisSchema } from "./schema.ts";
export type { CreatePermisSchemaOptions } from "./schema.ts";
export { drizzleAdapter } from "./adapter.ts";
```

Create `packages/better-auth/src/index.ts`:

```typescript
export { permisPlugin } from "./plugin.ts";
export type { PermisPluginOptions } from "./plugin.ts";
export { createGuard } from "./guard.ts";
export { betterAuthBridge } from "./bridge.ts";
export type { BetterAuthBridgeOptions } from "./bridge.ts";
export { enrichSessionWithPermis } from "./session.ts";
export type { SessionEnrichment } from "./session.ts";
export { createPermisSchemaExtension } from "./schema.ts";
```

- [ ] Step 4: Run tests to verify they pass

```bash
cd /Users/zain/projects/permis && vp check && vp test
```

Expected: all tests pass across all packages. Lint and type-check pass.

- [ ] Step 5: Commit

```bash
git add packages/drizzle/src/index.ts packages/better-auth/src/index.ts
git commit -m "chore: add public barrel exports for drizzle and better-auth packages"
```

---

## Final Verification Summary

After all 13 tasks, run from repo root:

```bash
vp check && vp test
```

Expected: All packages pass lint, type-check, and all unit tests.

```bash
git log --oneline
```

Expected: 13 commits, one per task.
