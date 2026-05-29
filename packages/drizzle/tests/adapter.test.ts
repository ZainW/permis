import { expect, test } from "vite-plus/test";
import { PermisEngine, definePermission, defineRole } from "@permis/core";
import { createPermisSchema } from "../src/schema.ts";
import { drizzleAdapter } from "../src/adapter.ts";

async function setupDb() {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");

  const schema = createPermisSchema();
  const sqlite = new Database(":memory:");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS permis_roles (
      name TEXT PRIMARY KEY, description TEXT, condition TEXT,
      active INTEGER DEFAULT 1, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS permis_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, resource TEXT NOT NULL,
      fields TEXT, condition TEXT, description TEXT
    );
    CREATE TABLE IF NOT EXISTS permis_role_permissions (
      role_name TEXT NOT NULL REFERENCES permis_roles(name) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permis_permissions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS permis_subject_roles (
      subject_id TEXT NOT NULL,
      role_name TEXT NOT NULL REFERENCES permis_roles(name) ON DELETE CASCADE,
      granted_at INTEGER NOT NULL, granted_by TEXT
    );
  `);

  const db = drizzle(sqlite, { schema });
  return { db, schema };
}

async function seed() {
  const { db, schema: s } = await setupDb();

  db.insert(s.roles).values({ name: "editor", created_at: new Date() }).run();
  db.insert(s.roles).values({ name: "admin", created_at: new Date() }).run();

  const p1 = db
    .insert(s.permissions)
    .values({ action: "read", resource: "post", description: "Read posts" })
    .returning({ id: s.permissions.id })
    .get();
  const p2 = db
    .insert(s.permissions)
    .values({ action: "write", resource: "post", description: "Write posts" })
    .returning({ id: s.permissions.id })
    .get();
  const p3 = db
    .insert(s.permissions)
    .values({ action: "manage", resource: "user", description: "Manage users" })
    .returning({ id: s.permissions.id })
    .get();

  db.insert(s.rolePermissions).values({ role_name: "editor", permission_id: p1!.id }).run();
  db.insert(s.rolePermissions).values({ role_name: "editor", permission_id: p2!.id }).run();
  db.insert(s.rolePermissions).values({ role_name: "admin", permission_id: p3!.id }).run();

  db.insert(s.subjectRoles)
    .values({
      subject_id: "user-1",
      role_name: "editor",
      granted_at: new Date(),
    })
    .run();
  db.insert(s.subjectRoles)
    .values({
      subject_id: "user-2",
      role_name: "admin",
      granted_at: new Date(),
    })
    .run();

  const adapter = drizzleAdapter(db, s);
  return { db, schema: s, adapter };
}

test("drizzleAdapter: getRolesForSubject returns role names", async () => {
  const { adapter } = await seed();
  const roles = await adapter.getRolesForSubject("user-1");
  expect(roles).toEqual(["editor"]);
});

test("drizzleAdapter: getRolesForSubject returns empty for unknown subject", async () => {
  const { adapter } = await seed();
  const roles = await adapter.getRolesForSubject("unknown");
  expect(roles).toEqual([]);
});

test("drizzleAdapter: getPermissionsForRole returns permissions", async () => {
  const { adapter } = await seed();
  const perms = await adapter.getPermissionsForRole("editor");
  expect(perms.length).toBe(2);
  const actions = perms.map((p) => p.action as string).sort((a, b) => a.localeCompare(b));
  expect(actions).toEqual(["read", "write"]);
});

test("drizzleAdapter: assignRole + getRolesForSubject roundtrip", async () => {
  const { adapter } = await seed();
  await adapter.assignRole?.("user-3", "editor");
  const roles = await adapter.getRolesForSubject("user-3");
  expect(roles).toEqual(["editor"]);
});

test("drizzleAdapter: revokeRole removes assignment", async () => {
  const { adapter } = await seed();
  await adapter.assignRole?.("user-4", "editor");
  await adapter.revokeRole?.("user-4", "editor");
  const roles = await adapter.getRolesForSubject("user-4");
  expect(roles).toEqual([]);
});

test("drizzleAdapter: resolveSubject returns subject object", async () => {
  const { adapter } = await seed();
  const s = await adapter.resolveSubject("user-1");
  expect(typeof s === "object" && "id" in s && s.id).toBe("user-1");
});

test("drizzleAdapter: integration with PermisEngine", async () => {
  const { adapter } = await seed();
  const readPost = definePermission("read", "post").build();
  const writePost = definePermission("write", "post").build();
  const editor = defineRole("editor").with(readPost, writePost).build();
  const admin = defineRole("admin").with(definePermission("manage", "user").build()).build();
  const engine = new PermisEngine({ roles: [editor, admin], adapter });
  expect(await engine.can("user-1", "read", "post")).toBe(true);
  expect(await engine.can("user-2", "manage", "user")).toBe(true);
  expect(await engine.can("user-1", "manage", "user")).toBe(false);
});
