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
  return { roles: subjectRoles, permissions };
}
