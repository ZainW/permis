import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export interface PermisSchemaOptions {
  tablePrefix?: string;
}

export function createPermisSchema(options: PermisSchemaOptions = {}) {
  const prefix = options.tablePrefix ?? "permis_";

  const roles = sqliteTable(`${prefix}roles`, {
    name: text("name").primaryKey(),
    description: text("description"),
    condition: text("condition", { mode: "json" }),
    active: integer("active", { mode: "boolean" }).default(true),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  });

  const permissions = sqliteTable(`${prefix}permissions`, {
    id: integer("id").primaryKey({ autoIncrement: true }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    fields: text("fields", { mode: "json" }),
    condition: text("condition", { mode: "json" }),
    description: text("description"),
  });

  const rolePermissions = sqliteTable(`${prefix}role_permissions`, {
    role_name: text("role_name")
      .notNull()
      .references(() => roles.name, { onDelete: "cascade" }),
    permission_id: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  });

  const subjectRoles = sqliteTable(`${prefix}subject_roles`, {
    subject_id: text("subject_id").notNull(),
    role_name: text("role_name")
      .notNull()
      .references(() => roles.name, { onDelete: "cascade" }),
    granted_at: integer("granted_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    granted_by: text("granted_by"),
  });

  return { roles, permissions, rolePermissions, subjectRoles };
}
