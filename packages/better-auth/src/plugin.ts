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
