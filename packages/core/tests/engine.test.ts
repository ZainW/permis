import { expect, test } from "vite-plus/test";
import { PermisEngine } from "../src/engine.ts";
import { definePermission } from "../src/permission.ts";
import { defineRole } from "../src/role.ts";
import type { PermisAdapter, Subject, Resource } from "../src/types.ts";

interface NaiveAdapter extends PermisAdapter {
  _addRole(sid: string, rn: string): void;
  _addSubject(s: Subject): void;
  _addResource(r: Resource): void;
}

function createNaiveAdapter(): NaiveAdapter {
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
  expect(await engine.can("reader", "read", "post")).toBe(true);
  expect(await engine.can("reader", "write", "post")).toBe(false);
});

// --- Adapter mode ---
test("PermisEngine adapter: delegates to adapter for role resolution", async () => {
  const readPost = definePermission("read", "post").build();
  const editor = defineRole("editor").with(readPost).build();
  const adapter = createNaiveAdapter();
  adapter._addRole("user-1", "editor");
  const engine = new PermisEngine({ roles: [editor], adapter });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
});

test("PermisEngine adapter: resolves subject via adapter for condition evaluation", async () => {
  const readPost = definePermission("read", "post")
    .when((ctx) => ctx.subject.id === "user-1")
    .build();
  const editor = defineRole("editor").with(readPost).build();
  const adapter = createNaiveAdapter();
  adapter._addRole("user-1", "editor");
  const engine = new PermisEngine({ roles: [editor], adapter });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
});
