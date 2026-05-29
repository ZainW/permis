import { eq, and } from "drizzle-orm";
import type { PermisAdapter, Permission, Subject, Resource } from "@permis/core";
import type { createPermisSchema } from "./schema.ts";

type Schema = ReturnType<typeof createPermisSchema>;
type DrizzleDb = ReturnType<typeof import("drizzle-orm/better-sqlite3").drizzle>;

export function drizzleAdapter(db: DrizzleDb, schema: Schema): PermisAdapter {
  const { permissions, rolePermissions, subjectRoles } = schema;

  const adapter: PermisAdapter = {
    async getRolesForSubject(subjectId: string): Promise<string[]> {
      const rows = db
        .select({ roleName: subjectRoles.role_name })
        .from(subjectRoles)
        .where(eq(subjectRoles.subject_id, subjectId))
        .all();
      return rows.map((r) => r.roleName);
    },

    async getPermissionsForRole(roleName: string): Promise<Permission[]> {
      const rows = db
        .select({
          action: permissions.action,
          resource: permissions.resource,
          fields: permissions.fields,
          condition: permissions.condition,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
        .where(eq(rolePermissions.role_name, roleName))
        .all();

      return rows.map((r) => {
        const perm: Permission = { action: r.action, resource: r.resource };
        if (r.fields) {
          try {
            perm.fields = JSON.parse(r.fields as string);
          } catch {
            /* ignore */
          }
        }
        if (r.condition) {
          try {
            const conditions = JSON.parse(r.condition as string);
            if (Array.isArray(conditions)) {
              for (const c of conditions) {
                if (c.operator === "matches" && typeof c.value === "string") {
                  try {
                    c.value = new RegExp(c.value);
                  } catch {
                    /* keep as string */
                  }
                }
              }
            }
            perm.conditions = conditions;
          } catch {
            /* ignore */
          }
        }
        if (r.description) perm.description = r.description as string;
        return perm;
      });
    },

    async getPermissionsForSubject(subjectId: string): Promise<Permission[]> {
      const roleRows = db
        .select({ roleName: subjectRoles.role_name })
        .from(subjectRoles)
        .where(eq(subjectRoles.subject_id, subjectId))
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
        .where(and(eq(subjectRoles.subject_id, subjectId), eq(subjectRoles.role_name, roleName)))
        .all();
      if (existing.length === 0) {
        db.insert(subjectRoles)
          .values({
            subject_id: subjectId,
            role_name: roleName,
            granted_at: new Date(),
          })
          .run();
      }
    },

    async revokeRole(subjectId: string, roleName: string): Promise<void> {
      db.delete(subjectRoles)
        .where(and(eq(subjectRoles.subject_id, subjectId), eq(subjectRoles.role_name, roleName)))
        .run();
    },

    async grantPermission(roleName: string, permission: Permission): Promise<void> {
      const action = Array.isArray(permission.action)
        ? JSON.stringify(permission.action)
        : permission.action;
      const resource = Array.isArray(permission.resource)
        ? JSON.stringify(permission.resource)
        : permission.resource;

      let conditionJson: string | null = null;
      if (permission.conditions) {
        const serializable = permission.conditions.map((c) => {
          if (c.operator === "matches" && c.value instanceof RegExp) {
            return { ...c, value: c.value.source };
          }
          return c;
        });
        conditionJson = JSON.stringify(serializable);
      }

      const result = db
        .insert(permissions)
        .values({
          action,
          resource,
          fields: permission.fields ? JSON.stringify(permission.fields) : null,
          condition: conditionJson,
          description: permission.description ?? null,
        })
        .returning({ id: permissions.id })
        .get();
      if (result) {
        db.insert(rolePermissions).values({ role_name: roleName, permission_id: result.id }).run();
      }
    },

    async revokePermission(roleName: string, action: string, resource: string): Promise<void> {
      const perms = db
        .select({ id: permissions.id })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
        .where(
          and(
            eq(rolePermissions.role_name, roleName),
            eq(permissions.action, action),
            eq(permissions.resource, resource),
          ),
        )
        .all();
      for (const p of perms) {
        db.delete(rolePermissions).where(eq(rolePermissions.permission_id, p.id)).run();
        db.delete(permissions).where(eq(permissions.id, p.id)).run();
      }
    },
  };

  return adapter;
}
