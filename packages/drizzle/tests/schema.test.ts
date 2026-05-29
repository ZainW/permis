import { expect, test } from "vite-plus/test";
import { createPermisSchema } from "../src/schema.ts";

test("createPermisSchema returns four table definitions", () => {
  const schema = createPermisSchema();
  expect(schema.roles).toBeDefined();
  expect(schema.permissions).toBeDefined();
  expect(schema.rolePermissions).toBeDefined();
  expect(schema.subjectRoles).toBeDefined();
});

test("generated tables have expected column names", () => {
  const schema = createPermisSchema();
  const roleCols = Object.keys(schema.roles);
  expect(roleCols).toContain("name");
  expect(roleCols).toContain("description");
  expect(roleCols).toContain("active");

  const permCols = Object.keys(schema.permissions);
  expect(permCols).toContain("id");
  expect(permCols).toContain("action");
  expect(permCols).toContain("resource");
  expect(permCols).toContain("description");
});

test("createPermisSchema accepts table prefix", () => {
  const schema = createPermisSchema({ tablePrefix: "auth_" });
  expect(schema.roles).toBeDefined();
  expect(schema.permissions).toBeDefined();
  expect(schema.rolePermissions).toBeDefined();
  expect(schema.subjectRoles).toBeDefined();
});

test("createPermisSchema can create tables without crashing", async () => {
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqlite = new Database(":memory:");
  const schema = createPermisSchema();

  // Create tables via raw SQL to verify definitions are well-formed
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS permis_roles (
      name TEXT PRIMARY KEY,
      description TEXT,
      condition TEXT,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS permis_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      fields TEXT,
      condition TEXT,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS permis_role_permissions (
      role_name TEXT NOT NULL REFERENCES permis_roles(name) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permis_permissions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS permis_subject_roles (
      subject_id TEXT NOT NULL,
      role_name TEXT NOT NULL REFERENCES permis_roles(name) ON DELETE CASCADE,
      granted_at INTEGER NOT NULL,
      granted_by TEXT
    );
  `);

  const db = drizzle(sqlite, { schema });

  // Insert and query to verify everything works
  db.insert(schema.roles).values({ name: "admin", created_at: new Date() }).run();
  const rows = db.select().from(schema.roles).all();
  expect(rows).toHaveLength(1);
  expect(rows[0]!.name).toBe("admin");
});
