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
  let _pendingSession: Promise<Record<string, unknown>> | null = null;

  async function getSession(): Promise<Record<string, unknown>> {
    if (auth.$context?.session) return auth.$context.session;
    if (_pendingSession) return _pendingSession;
    _pendingSession = (auth.api?.getSession?.() ?? Promise.resolve({})).finally(() => {
      _pendingSession = null;
    });
    return _pendingSession;
  }

  return {
    async getRolesForSubject(_subjectId: string): Promise<string[]> {
      const session = await getSession();
      if (options?.roleResolver) return options.roleResolver(session);
      return [];
    },

    async getPermissionsForRole(_roleName: string): Promise<Permission[]> {
      const session = await getSession();
      if (options?.permissionResolver) return options.permissionResolver(session);
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
