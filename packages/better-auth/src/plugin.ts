import type { Role, Permission } from "@permis/core";

export interface PermisPluginOptions {
  roles?: Role[];
  permissions?: Permission[];
  extendSchema?: boolean;
}

export function permisPlugin(options: PermisPluginOptions) {
  return {
    id: "permis" as const,
    init: (auth: { $context: Record<string, unknown> }) => {
      auth.$context.permis = {
        roles: options.roles ?? [],
        permissions: options.permissions ?? [],
      };
    },
  };
}
